using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuminaLibrary.Infrastructure;
using LuminaLibrary.Domain;
using LuminaLibrary.Application;

namespace LuminaLibrary.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize(Roles = "Admin,Librarian")]
    public class ReportsController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public ReportsController(LibraryDbContext context)
        {
            _context = context;
        }

        private async Task UpdateFines()
        {
            var now = DateTime.UtcNow;
            var activeBorrows = await _context.BorrowRecords
                .Where(r => r.Status == BorrowRecordStatus.Borrowed && r.DueDate < now)
                .ToListAsync();

            foreach (var r in activeBorrows)
            {
                r.Status = BorrowRecordStatus.Overdue;
                var daysLate = (now - r.DueDate).Days;
                if (daysLate > 0)
                {
                    r.FineAmount = daysLate * 5000;
                }
            }
            await _context.SaveChangesAsync();
        }

        // GET: api/reports/summary
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            await UpdateFines();

            var totalTitles = await _context.Books.CountAsync();
            var totalBooks = await _context.Books.SumAsync(b => b.TotalCopies);
            
            var totalBorrowed = await _context.BorrowRecords.CountAsync(r => r.Status == BorrowRecordStatus.Borrowed);
            var totalOverdue = await _context.BorrowRecords.CountAsync(r => r.Status == BorrowRecordStatus.Overdue);

            var collectedFines = await _context.BorrowRecords
                .Where(r => r.FineAmount > 0 && r.IsFinePaid)
                .SumAsync(r => r.FineAmount);

            var pendingFines = await _context.BorrowRecords
                .Where(r => r.FineAmount > 0 && !r.IsFinePaid)
                .SumAsync(r => r.FineAmount);

            var weekAgo = DateTime.UtcNow.AddDays(-7);
            var newBooksThisWeek = await _context.Books.CountAsync(b => b.CreatedAt >= weekAgo);
            var totalMembers = await _context.Users
                .Include(u => u.Role)
                .CountAsync(u => u.Role != null && u.Role.Name == "Member");

            var data = new
            {
                totalTitles,
                totalBooks,
                totalBorrowed,
                totalOverdue,
                collectedFines,
                pendingFines,
                newBooksThisWeek,
                totalMembers
            };

            return Ok(ApiResponse<object>.Ok(data, "Báo cáo tổng quan hệ thống."));
        }

        // GET: api/reports/top-borrowed-books
        [HttpGet("top-borrowed-books")]
        public async Task<IActionResult> GetTopBorrowedBooks([FromQuery] int top = 10)
        {
            var topBorrowed = await _context.BorrowRecords
                .GroupBy(r => r.BookId)
                .Select(g => new
                {
                    BookId = g.Key,
                    BorrowCount = g.Count()
                })
                .OrderByDescending(x => x.BorrowCount)
                .Take(top)
                .ToListAsync();

            var list = new List<object>();
            foreach (var item in topBorrowed)
            {
                var book = await _context.Books.FindAsync(item.BookId);
                if (book != null)
                {
                    list.Add(new
                    {
                        book = new { id = book.Id, title = book.Title, isbn = book.ISBN, coverImageUrl = book.CoverImageUrl },
                        borrowCount = item.BorrowCount
                    });
                }
            }

            return Ok(ApiResponse<List<object>>.Ok(list, "Top sách được mượn nhiều nhất."));
        }

        // GET: api/reports/top-active-members
        [HttpGet("top-active-members")]
        public async Task<IActionResult> GetTopActiveMembers([FromQuery] int top = 10)
        {
            var topMembers = await _context.BorrowRecords
                .GroupBy(r => r.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    BorrowCount = g.Count()
                })
                .OrderByDescending(x => x.BorrowCount)
                .Take(top)
                .ToListAsync();

            var list = new List<object>();
            foreach (var item in topMembers)
            {
                var user = await _context.Users.FindAsync(item.UserId);
                if (user != null)
                {
                    list.Add(new
                    {
                        user = new { id = user.Id, fullName = user.FullName, email = user.Email, phoneNumber = user.PhoneNumber },
                        borrowCount = item.BorrowCount
                    });
                }
            }

            return Ok(ApiResponse<List<object>>.Ok(list, "Top thành viên mượn nhiều nhất."));
        }

        // GET: api/reports/fines-summary
        [HttpGet("fines-summary")]
        public async Task<IActionResult> GetFinesSummary()
        {
            await UpdateFines();

            var list = await _context.BorrowRecords
                .Include(r => r.Book)
                .Include(r => r.User)
                .Where(r => r.FineAmount > 0)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    id = r.Id,
                    user = r.User != null ? new { fullName = r.User.FullName, email = r.User.Email } : null,
                    bookTitle = r.Book != null ? r.Book.Title : "Sách đã xóa",
                    fineAmount = r.FineAmount,
                    isFinePaid = r.IsFinePaid,
                    dueDate = r.DueDate,
                    returnDate = r.ReturnDate
                })
                .ToListAsync();

            return Ok(ApiResponse<List<object>>.Ok(list.Cast<object>().ToList(), "Chi tiết tiền phạt."));
        }

        // GET: api/reports/recent-activity?limit=15
        [HttpGet("recent-activity")]
        public async Task<IActionResult> GetRecentActivity([FromQuery] int limit = 15)
        {
            await UpdateFines();

            var records = await _context.BorrowRecords
                .Include(r => r.Book)
                .Include(r => r.User)
                .OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt)
                .Take(limit)
                .ToListAsync();

            var activities = records.Select(r =>
            {
                var userName = r.User?.FullName ?? "Không rõ";
                var words = userName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var initials = string.Join("", words.Take(2).Select(w => char.ToUpper(w[0])));

                string actType, status, statusColor, bgColor;
                switch (r.Status)
                {
                    case BorrowRecordStatus.Pending:
                        actType = "Yêu cầu mượn"; status = "PENDING";
                        statusColor = "bg-amber-50 text-amber-700 border-amber-100";
                        bgColor = "bg-amber-100 text-amber-800"; break;
                    case BorrowRecordStatus.ReturnPending:
                        actType = "Yêu cầu trả"; status = "RETURN PENDING";
                        statusColor = "bg-purple-50 text-purple-700 border-purple-100";
                        bgColor = "bg-purple-100 text-purple-850"; break;
                    case BorrowRecordStatus.Borrowed:
                        actType = "Mượn sách"; status = "BORROWED";
                        statusColor = "bg-blue-50 text-blue-700 border-blue-100";
                        bgColor = "bg-blue-100 text-blue-800"; break;
                    case BorrowRecordStatus.Returned:
                        actType = "Trả sách"; status = "RETURNED";
                        statusColor = "bg-green-50 text-green-700 border-green-100";
                        bgColor = "bg-green-100 text-green-800"; break;
                    case BorrowRecordStatus.Overdue:
                        actType = "Quá hạn"; status = "OVERDUE";
                        statusColor = "bg-red-50 text-red-700 border-red-100";
                        bgColor = "bg-rose-100 text-rose-800"; break;
                    case BorrowRecordStatus.Rejected:
                        actType = "Từ chối"; status = "REJECTED";
                        statusColor = "bg-slate-50 text-slate-700 border-slate-100";
                        bgColor = "bg-slate-100 text-slate-800"; break;
                    default:
                        actType = "Hoạt động"; status = r.Status.ToString().ToUpper();
                        statusColor = "bg-slate-50 text-slate-700 border-slate-100";
                        bgColor = "bg-slate-100 text-slate-800"; break;
                }

                var eventTime = r.UpdatedAt ?? r.CreatedAt;
                var now = DateTime.UtcNow;
                var diff = now - eventTime;
                string timeLabel;
                if (diff.TotalMinutes < 1) timeLabel = "Vừa xong";
                else if (diff.TotalHours < 1) timeLabel = $"{(int)diff.TotalMinutes} phút trước";
                else if (diff.TotalHours < 24) timeLabel = $"{(int)diff.TotalHours} giờ trước";
                else if (diff.TotalDays < 2) timeLabel = $"Hôm qua, {eventTime.ToLocalTime():HH:mm}";
                else timeLabel = eventTime.ToLocalTime().ToString("dd/MM/yyyy HH:mm");

                return new
                {
                    id = r.Id.ToString(),
                    userInitial = initials.Length > 0 ? initials : "?",
                    userName,
                    bookTitle = r.Book?.Title ?? "Sách đã xóa",
                    type = actType,
                    time = timeLabel,
                    status,
                    statusColor,
                    bgColor
                };
            }).ToList();

            return Ok(ApiResponse<object>.Ok(activities, "Hoạt động gần đây."));
        }

        // GET: api/reports/borrowing-trends?year=2026
        [HttpGet("borrowing-trends")]
        public async Task<IActionResult> GetBorrowingTrends([FromQuery] int? year = null)
        {
            var targetYear = year ?? DateTime.UtcNow.Year;

            var records = await _context.BorrowRecords
                .Where(r => r.CreatedAt.Year == targetYear)
                .ToListAsync();

            var monthNames = new[] { "JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC" };
            var currentMonth = DateTime.UtcNow.Month;

            var months = Enumerable.Range(1, currentMonth).Select(m =>
            {
                var monthRecords = records.Where(r => r.CreatedAt.Month == m);
                return new
                {
                    month = monthNames[m - 1],
                    monthNumber = m,
                    books = monthRecords.Count(),
                    journals = 0  // extend later if journal category is tracked separately
                };
            }).ToList();

            return Ok(ApiResponse<object>.Ok(months, "Xu hướng mượn sách theo tháng."));
        }

        // GET: api/reports/top-categories?top=8
        [HttpGet("top-categories")]
        public async Task<IActionResult> GetTopCategories([FromQuery] int top = 8)
        {
            var categoryBorrows = await _context.BorrowRecords
                .Include(r => r.Book)
                .Where(r => r.Book != null && r.Book.CategoryId != Guid.Empty)
                .GroupBy(r => r.Book!.CategoryId)
                .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(top)
                .ToListAsync();

            var total = categoryBorrows.Sum(c => c.Count);
            if (total == 0)
            {
                // Fallback: count books per category if no borrow records
                var booksByCategory = await _context.Books
                    .Where(b => b.CategoryId != Guid.Empty)
                    .GroupBy(b => b.CategoryId)
                    .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(top)
                    .ToListAsync();

                total = booksByCategory.Sum(c => c.Count);
                if (total == 0) return Ok(ApiResponse<object>.Ok(new List<object>(), "Không có dữ liệu thể loại."));

                var fallbackResult = new List<object>();
                foreach (var item in booksByCategory)
                {
                    var cat = await _context.Categories.FindAsync(item.CategoryId);
                    if (cat != null)
                    {
                        fallbackResult.Add(new
                        {
                            name = cat.Name,
                            count = item.Count,
                            percentage = (int)Math.Round((double)item.Count / total * 100)
                        });
                    }
                }
                return Ok(ApiResponse<object>.Ok(fallbackResult, "Top thể loại (theo số đầu sách)."));
            }

            var result = new List<object>();
            foreach (var item in categoryBorrows)
            {
                var cat = await _context.Categories.FindAsync(item.CategoryId);
                if (cat != null)
                {
                    result.Add(new
                    {
                        name = cat.Name,
                        count = item.Count,
                        percentage = (int)Math.Round((double)item.Count / total * 100)
                    });
                }
            }

            return Ok(ApiResponse<object>.Ok(result, "Top thể loại được mượn nhiều nhất."));
        }
    }
}
