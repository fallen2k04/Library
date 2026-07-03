using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
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
    [Route("api/borrow-records")]
    [Authorize]
    public class CirculationController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public CirculationController(LibraryDbContext context)
        {
            _context = context;
        }

        private async Task UpdateOverdueStatuses()
        {
            var now = DateTime.UtcNow;
            var overdueRecords = await _context.BorrowRecords
                .Where(r => r.Status == "Borrowed" && r.DueDate < now)
                .ToListAsync();

            foreach (var record in overdueRecords)
            {
                record.Status = "Overdue";
                var daysLate = (now - record.DueDate).Days;
                if (daysLate > 0)
                {
                    record.FineAmount = daysLate * 5000;
                }
            }

            // Expiry reservations
            var expiredReservations = await _context.Reservations
                .Where(r => r.Status == "Available" && r.ExpiryDate < now)
                .ToListAsync();

            foreach (var res in expiredReservations)
            {
                res.Status = "Expired";
                // Shift next in queue
                var siblings = await _context.Reservations
                    .Where(r => r.BookId == res.BookId && r.Status == "Waiting")
                    .OrderBy(r => r.QueuePosition)
                    .ToListAsync();

                if (siblings.Count > 0)
                {
                    var next = siblings[0];
                    next.Status = "Available";
                    next.ExpiryDate = now.AddDays(3);
                    for (int i = 0; i < siblings.Count; i++)
                    {
                        siblings[i].QueuePosition = i + 1;
                    }
                }
            }

            await _context.SaveChangesAsync();
        }

        // POST: api/borrow-records
        [HttpPost]
        public async Task<IActionResult> CreateBorrow([FromBody] BorrowRequestDto dto)
        {
            await UpdateOverdueStatuses();

            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var loggedInUserRole = User.FindFirstValue(ClaimTypes.Role);

            if (!Guid.TryParse(loggedInUserIdString, out var loggedInUserId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Phiên đăng nhập không hợp lệ."));
            }

            Guid targetUserId = loggedInUserId;

            // Admin/Librarian can borrow on behalf of another user
            if ((loggedInUserRole == "Admin" || loggedInUserRole == "Librarian") && dto.UserId.HasValue)
            {
                targetUserId = dto.UserId.Value;
            }

            var targetUser = await _context.Users.FindAsync(targetUserId);
            if (targetUser == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy người dùng."));
            }

            if (targetUser.IsLocked)
            {
                return BadRequest(ApiResponse<object>.Fail("Tài khoản người mượn này đang bị khóa."));
            }

            // Quy định số lượng mượn tối đa và số ngày mượn tối đa tùy theo Membership Tiers
            int maxBooksLimit = 5;
            int maxLoanDays = 14;

            if (targetUser.MembershipTier == "Archive Scholar")
            {
                maxBooksLimit = 12;
                maxLoanDays = 30;
            }
            else if (targetUser.MembershipTier == "Research Fellow")
            {
                maxBooksLimit = int.MaxValue;
                maxLoanDays = int.MaxValue;
            }

            // Rule 1: Giới hạn mượn sách tùy theo hạng thành viên
            var activeBorrowCount = await _context.BorrowRecords
                .CountAsync(r => r.UserId == targetUserId && (r.Status == "Borrowed" || r.Status == "Overdue"));

            if (targetUser.MembershipTier != "Research Fellow" && activeBorrowCount >= maxBooksLimit)
            {
                return BadRequest(ApiResponse<object>.Fail($"Tài khoản của bạn thuộc hạng '{targetUser.MembershipTier}' chỉ được phép mượn tối đa {maxBooksLimit} cuốn cùng lúc."));
            }

            // Rule 4: Chặn mượn khi đang nợ phạt quá hạn
            var hasUnpaidOverdue = await _context.BorrowRecords
                .AnyAsync(r => r.UserId == targetUserId && r.Status == "Overdue" && !r.IsFinePaid);

            if (hasUnpaidOverdue)
            {
                return BadRequest(ApiResponse<object>.Fail("Tài khoản đang có sách quá hạn chưa trả hoặc chưa nộp phạt. Vui lòng thanh toán và hoàn trả sách trước khi mượn tiếp."));
            }

            var book = await _context.Books.FindAsync(dto.BookId);
            if (book == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy sách."));
            }

            // Rule 6: Check availability
            if (book.AvailableCopies <= 0)
            {
                return BadRequest(ApiResponse<object>.Fail("Sách hiện tại đã hết bản in khả dụng để mượn. Bạn có thể tiến hành đặt trước sách này."));
            }

            var isLibrarianOrAdmin = loggedInUserRole == "Admin" || loggedInUserRole == "Librarian";

            var borrowDate = DateTime.UtcNow;
            var dueDate = borrowDate.AddDays(maxLoanDays == int.MaxValue ? 365 : maxLoanDays);
            if (dto.DueDate.HasValue)
            {
                var localDue = dto.DueDate.Value.Date;
                dueDate = DateTime.SpecifyKind(localDue.AddHours(23).AddMinutes(59).AddSeconds(59), DateTimeKind.Utc);
                if (dueDate <= borrowDate)
                {
                    return BadRequest(ApiResponse<object>.Fail("Ngày trả sách mong muốn phải lớn hơn ngày mượn (hôm nay)."));
                }

                var durationDays = (dueDate - borrowDate).TotalDays;
                if (targetUser.MembershipTier != "Research Fellow" && durationDays > maxLoanDays)
                {
                    return BadRequest(ApiResponse<object>.Fail($"Hạng thành viên '{targetUser.MembershipTier}' chỉ được phép chọn ngày trả tối đa {maxLoanDays} ngày."));
                }
            }

            var record = new BorrowRecord
            {
                UserId = targetUserId,
                BookId = dto.BookId,
                BorrowDate = borrowDate,
                DueDate = dueDate,
                Status = isLibrarianOrAdmin ? "Borrowed" : "Pending",
                ApprovedByUserId = isLibrarianOrAdmin ? loggedInUserId : null,
                FineAmount = 0,
                IsFinePaid = false
            };

            if (isLibrarianOrAdmin)
            {
                book.AvailableCopies--;
            }

            _context.BorrowRecords.Add(record);
            await _context.SaveChangesAsync();

            var message = isLibrarianOrAdmin 
                ? "Tạo phiếu mượn sách thành công." 
                : "Gửi yêu cầu mượn sách thành công, vui lòng chờ thủ thư phê duyệt.";

            return Ok(ApiResponse<BorrowRecord>.Ok(record, message));
        }

        // PUT: api/borrow-records/{id}/approve
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> ApproveBorrow(Guid id)
        {
            var record = await _context.BorrowRecords
                .Include(r => r.Book)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (record == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy phiếu mượn."));
            }

            if (record.Status != "Pending")
            {
                return BadRequest(ApiResponse<object>.Fail("Phiếu mượn này đã được xử lý từ trước."));
            }

            if (record.Book == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy sách liên kết."));
            }

            if (record.Book.AvailableCopies <= 0)
            {
                return BadRequest(ApiResponse<object>.Fail("Sách này hiện không còn bản in khả dụng để duyệt mượn."));
            }

            // Check limit of 5 borrows
            var activeCount = await _context.BorrowRecords
                .CountAsync(r => r.UserId == record.UserId && (r.Status == "Borrowed" || r.Status == "Overdue"));

            if (activeCount >= 5)
            {
                return BadRequest(ApiResponse<object>.Fail("Thành viên này đã đạt giới hạn mượn 5 cuốn cùng lúc."));
            }

            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid.TryParse(loggedInUserIdString, out var loggedInUserId);

            record.Status = "Borrowed";
            record.ApprovedByUserId = loggedInUserId;
            record.BorrowDate = DateTime.UtcNow;
            record.DueDate = DateTime.UtcNow.AddDays(14);
            record.UpdatedAt = DateTime.UtcNow;
            record.Book.AvailableCopies--;

            // Fulfill reservation if exists
            var reservation = await _context.Reservations
                .FirstOrDefaultAsync(res => res.BookId == record.BookId && res.UserId == record.UserId && res.Status == "Available");
            if (reservation != null)
            {
                reservation.Status = "Fulfilled";
            }

            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(null!, "Phê duyệt yêu cầu mượn thành công."));
        }

        // PUT: api/borrow-records/{id}/reject
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> RejectBorrow(Guid id, [FromBody] string? notes)
        {
            var record = await _context.BorrowRecords.FindAsync(id);
            if (record == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy phiếu mượn."));
            }

            if (record.Status != "Pending")
            {
                return BadRequest(ApiResponse<object>.Fail("Phiếu mượn này đã được xử lý."));
            }

            record.Status = "Rejected";
            record.Notes = notes ?? "Thủ thư từ chối yêu cầu mượn.";
            record.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.Ok(null!, "Từ chối yêu cầu mượn thành công."));
        }

        // PUT: api/borrow-records/{id}/return
        [HttpPut("{id}/return")]
        public async Task<IActionResult> ReturnBook(Guid id)
        {
            await UpdateOverdueStatuses();

            var record = await _context.BorrowRecords
                .Include(r => r.Book)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (record == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy phiếu mượn."));
            }

            var loggedInUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var loggedInUserRole = User.FindFirstValue(ClaimTypes.Role);

            if (loggedInUserRole == "Member" && record.UserId.ToString() != loggedInUserId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Bạn không có quyền hoàn trả sách của người khác."));
            }

            if (record.Status != "Borrowed" && record.Status != "Overdue" && record.Status != "ReturnPending")
            {
                return BadRequest(ApiResponse<object>.Fail("Sách này đã được trả hoặc chưa được duyệt mượn."));
            }

            if (loggedInUserRole == "Admin" || loggedInUserRole == "Librarian")
            {
                var returnDate = DateTime.UtcNow;
                decimal fineAmount = 0;

                if (returnDate > record.DueDate)
                {
                    var diffDays = (returnDate - record.DueDate).Days;
                    if (diffDays > 0)
                    {
                        fineAmount = diffDays * 5000;
                    }
                }

                Guid.TryParse(loggedInUserId, out var parsedId);
                record.ReturnDate = returnDate;
                record.Status = "Returned";
                record.FineAmount = fineAmount;
                record.ReturnedToUserId = parsedId;
                record.UpdatedAt = DateTime.UtcNow;

                if (record.Book != null)
                {
                    record.Book.AvailableCopies = Math.Min(record.Book.TotalCopies, record.Book.AvailableCopies + 1);

                    // reservation queue check
                    var nextReservation = await _context.Reservations
                        .Where(res => res.BookId == record.BookId && res.Status == "Waiting")
                        .OrderBy(res => res.QueuePosition)
                        .FirstOrDefaultAsync();

                    if (nextReservation != null)
                    {
                        nextReservation.Status = "Available";
                        nextReservation.ExpiryDate = DateTime.UtcNow.AddDays(3); // 3 days to pick up

                        // Shift rest of the queue
                        var rest = await _context.Reservations
                            .Where(res => res.BookId == record.BookId && res.Status == "Waiting" && res.Id != nextReservation.Id)
                            .OrderBy(res => res.QueuePosition)
                            .ToListAsync();

                        for (int i = 0; i < rest.Count; i++)
                        {
                            rest[i].QueuePosition = i + 1;
                        }
                    }
                }

                await _context.SaveChangesAsync();

                var msg = fineAmount > 0
                    ? $"Duyệt trả sách thành công. Thành viên đã quá hạn trả và bị phạt {fineAmount.ToString("N0")} VNĐ."
                    : "Duyệt trả sách thành công.";

                return Ok(ApiResponse<object>.Ok(null!, msg));
            }
            else
            {
                // Member requesting return - set to ReturnPending
                record.Status = "ReturnPending";
                record.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(ApiResponse<object>.Ok(null!, "Gửi yêu cầu trả sách thành công, vui lòng chờ thủ thư kiểm duyệt."));
            }
        }

        // PUT: api/borrow-records/{id}/pay-fine
        [HttpPut("{id}/pay-fine")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> PayFine(Guid id)
        {
            var record = await _context.BorrowRecords.FindAsync(id);
            if (record == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy phiếu mượn."));
            }

            if (record.FineAmount <= 0)
            {
                return BadRequest(ApiResponse<object>.Fail("Phiếu mượn này không có khoản phạt nào."));
            }

            if (record.IsFinePaid)
            {
                return BadRequest(ApiResponse<object>.Fail("Khoản phạt này đã được thanh toán rồi."));
            }

            record.IsFinePaid = true;
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(null!, "Đã thu tiền phạt thành công."));
        }

        // GET: api/borrow-records
        [HttpGet]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> GetBorrowRecords(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null,
            [FromQuery] Guid? userId = null)
        {
            await UpdateOverdueStatuses();

            var query = _context.BorrowRecords
                .Include(r => r.Book)
                .Include(r => r.User)
                    .ThenInclude(u => u!.Role)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            if (userId.HasValue && userId != Guid.Empty)
            {
                query = query.Where(r => r.UserId == userId.Value);
            }

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var list = await query.OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new BorrowRecordDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    BookId = r.BookId,
                    ApprovedByUserId = r.ApprovedByUserId,
                    ReturnedToUserId = r.ReturnedToUserId,
                    BorrowDate = r.BorrowDate,
                    DueDate = r.DueDate,
                    ReturnDate = r.ReturnDate,
                    Status = r.Status,
                    FineAmount = r.FineAmount,
                    IsFinePaid = r.IsFinePaid,
                    Notes = r.Notes,
                    CreatedAt = r.CreatedAt,
                    BookDetail = r.Book != null ? new BookDto
                    {
                        Id = r.Book.Id,
                        Title = r.Book.Title,
                        ISBN = r.Book.ISBN,
                        CoverImageUrl = r.Book.CoverImageUrl
                    } : null,
                    UserDetail = r.User != null ? new UserDto
                    {
                        Id = r.User.Id,
                        FullName = r.User.FullName,
                        Email = r.User.Email,
                        Role = r.User.Role != null ? r.User.Role.Name : "Guest"
                    } : null
                })
                .ToListAsync();

            var response = ApiResponse<List<BorrowRecordDto>>.Ok(list, "Lấy lịch sử mượn trả thành công.");
            response.Pagination = new PaginationInfo
            {
                CurrentPage = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages
            };

            return Ok(response);
        }

        // GET: api/borrow-records/my-history
        [HttpGet("my-history")]
        public async Task<IActionResult> GetMyHistory(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null)
        {
            await UpdateOverdueStatuses();

            var loggedInUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(loggedInUserId, out var userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Phiên hoạt động không hợp lệ."));
            }

            var query = _context.BorrowRecords
                .Include(r => r.Book)
                .Where(r => r.UserId == userId)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var list = await query.OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new BorrowRecordDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    BookId = r.BookId,
                    ApprovedByUserId = r.ApprovedByUserId,
                    ReturnedToUserId = r.ReturnedToUserId,
                    BorrowDate = r.BorrowDate,
                    DueDate = r.DueDate,
                    ReturnDate = r.ReturnDate,
                    Status = r.Status,
                    FineAmount = r.FineAmount,
                    IsFinePaid = r.IsFinePaid,
                    Notes = r.Notes,
                    CreatedAt = r.CreatedAt,
                    BookDetail = r.Book != null ? new BookDto
                    {
                        Id = r.Book.Id,
                        Title = r.Book.Title,
                        ISBN = r.Book.ISBN,
                        CoverImageUrl = r.Book.CoverImageUrl
                    } : null
                })
                .ToListAsync();

            var response = ApiResponse<List<BorrowRecordDto>>.Ok(list, "Lấy lịch sử mượn cá nhân thành công.");
            response.Pagination = new PaginationInfo
            {
                CurrentPage = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages
            };

            return Ok(response);
        }

        // GET: api/borrow-records/overdue
        [HttpGet("overdue")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> GetOverdue()
        {
            await UpdateOverdueStatuses();

            var list = await _context.BorrowRecords
                .Include(r => r.Book)
                .Include(r => r.User)
                .Where(r => r.Status == "Overdue" || (r.Status == "Returned" && r.FineAmount > 0 && !r.IsFinePaid))
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new BorrowRecordDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    BookId = r.BookId,
                    BorrowDate = r.BorrowDate,
                    DueDate = r.DueDate,
                    ReturnDate = r.ReturnDate,
                    Status = r.Status,
                    FineAmount = r.FineAmount,
                    IsFinePaid = r.IsFinePaid,
                    BookDetail = r.Book != null ? new BookDto { Id = r.Book.Id, Title = r.Book.Title, ISBN = r.Book.ISBN, CoverImageUrl = r.Book.CoverImageUrl } : null,
                    UserDetail = r.User != null ? new UserDto { Id = r.User.Id, FullName = r.User.FullName, Email = r.User.Email, PhoneNumber = r.User.PhoneNumber } : null
                })
                .ToListAsync();

            return Ok(ApiResponse<List<BorrowRecordDto>>.Ok(list, "Danh sách quá hạn và nợ phạt."));
        }

        // GET: api/borrow-records/currently-borrowed
        [HttpGet("currently-borrowed")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> GetCurrentlyBorrowed()
        {
            await UpdateOverdueStatuses();

            var list = await _context.BorrowRecords
                .Include(r => r.Book)
                .Include(r => r.User)
                .Where(r => r.Status == "Borrowed" || r.Status == "Overdue")
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new BorrowRecordDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    BookId = r.BookId,
                    BorrowDate = r.BorrowDate,
                    DueDate = r.DueDate,
                    Status = r.Status,
                    BookDetail = r.Book != null ? new BookDto { Id = r.Book.Id, Title = r.Book.Title, ISBN = r.Book.ISBN, CoverImageUrl = r.Book.CoverImageUrl } : null,
                    UserDetail = r.User != null ? new UserDto { Id = r.User.Id, FullName = r.User.FullName, Email = r.User.Email } : null
                })
                .ToListAsync();

            return Ok(ApiResponse<List<BorrowRecordDto>>.Ok(list, "Sách đang được mượn trên hệ thống."));
        }
    }
}
