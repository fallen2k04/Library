using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using LuminaLibrary.Domain;
using LuminaLibrary.Infrastructure;
using LuminaLibrary.Application;

namespace LuminaLibrary.Services
{
    public class CirculationService : ICirculationService
    {
        private readonly LibraryDbContext _context;
        private readonly IConfiguration _configuration;

        public CirculationService(LibraryDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<ApiResponse<BorrowRecord>> CreateBorrowAsync(BorrowRequestDto dto, Guid loggedInUserId, string loggedInUserRole)
        {
            Guid targetUserId = loggedInUserId;

            // Admin/Librarian can borrow on behalf of another user
            if ((loggedInUserRole == "Admin" || loggedInUserRole == "Librarian") && dto.UserId.HasValue)
            {
                targetUserId = dto.UserId.Value;
            }

            var targetUser = await _context.Users.FindAsync(targetUserId);
            if (targetUser == null)
            {
                return ApiResponse<BorrowRecord>.Fail("Không tìm thấy người dùng.");
            }

            if (targetUser.IsLocked)
            {
                return ApiResponse<BorrowRecord>.Fail("Tài khoản người mượn này đang bị khóa.");
            }

            // Read rules from Configuration with Fallbacks
            int maxBooksLimit = _configuration.GetValue<int>("LibraryRules:MaxActiveBorrows", 5);
            int maxLoanDays = _configuration.GetValue<int>("LibraryRules:DefaultLoanDurationDays", 14);

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
                .CountAsync(r => r.UserId == targetUserId && (r.Status == BorrowRecordStatus.Borrowed || r.Status == BorrowRecordStatus.Overdue));

            if (targetUser.MembershipTier != "Research Fellow" && activeBorrowCount >= maxBooksLimit)
            {
                return ApiResponse<BorrowRecord>.Fail($"Tài khoản của bạn thuộc hạng '{targetUser.MembershipTier}' chỉ được phép mượn tối đa {maxBooksLimit} cuốn cùng lúc.");
            }

            // Rule 4: Chặn mượn khi đang nợ phạt quá hạn
            var hasUnpaidOverdue = await _context.BorrowRecords
                .AnyAsync(r => r.UserId == targetUserId && r.Status == BorrowRecordStatus.Overdue && !r.IsFinePaid);

            if (hasUnpaidOverdue)
            {
                return ApiResponse<BorrowRecord>.Fail("Tài khoản đang có sách quá hạn chưa trả hoặc chưa nộp phạt. Vui lòng thanh toán và hoàn trả sách trước khi mượn tiếp.");
            }

            var book = await _context.Books.FindAsync(dto.BookId);
            if (book == null)
            {
                return ApiResponse<BorrowRecord>.Fail("Không tìm thấy sách.");
            }

            // Rule 6: Check availability
            if (book.AvailableCopies <= 0)
            {
                return ApiResponse<BorrowRecord>.Fail("Sách hiện tại đã hết bản in khả dụng để mượn. Bạn có thể tiến hành đặt trước sách này.");
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
                    return ApiResponse<BorrowRecord>.Fail("Ngày trả sách mong muốn phải lớn hơn ngày mượn (hôm nay).");
                }

                var durationDays = (dueDate - borrowDate).TotalDays;
                if (targetUser.MembershipTier != "Research Fellow" && durationDays > maxLoanDays)
                {
                    return ApiResponse<BorrowRecord>.Fail($"Hạng thành viên '{targetUser.MembershipTier}' chỉ được phép chọn ngày trả tối đa {maxLoanDays} ngày.");
                }
            }

            var record = new BorrowRecord
            {
                UserId = targetUserId,
                BookId = dto.BookId,
                BorrowDate = borrowDate,
                DueDate = dueDate,
                Status = isLibrarianOrAdmin ? BorrowRecordStatus.Borrowed : BorrowRecordStatus.Pending,
                ApprovedByUserId = isLibrarianOrAdmin ? loggedInUserId : null,
                FineAmount = 0,
                IsFinePaid = false
            };

            if (isLibrarianOrAdmin)
            {
                book.AvailableCopies--;
            }

            _context.BorrowRecords.Add(record);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return ApiResponse<BorrowRecord>.Fail("Sách này đang được xử lý hoặc cập nhật bởi một luồng khác. Vui lòng thử lại.");
            }

            var message = isLibrarianOrAdmin 
                ? "Tạo phiếu mượn sách thành công." 
                : "Gửi yêu cầu mượn sách thành công, vui lòng chờ thủ thư phê duyệt.";

            return ApiResponse<BorrowRecord>.Ok(record, message);
        }

        public async Task<ApiResponse<object>> ApproveBorrowAsync(Guid id, Guid loggedInUserId)
        {
            var record = await _context.BorrowRecords
                .Include(r => r.Book)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (record == null)
            {
                return ApiResponse<object>.Fail("Không tìm thấy phiếu mượn.");
            }

            if (record.Status != BorrowRecordStatus.Pending)
            {
                return ApiResponse<object>.Fail("Phiếu mượn này đã được xử lý từ trước.");
            }

            if (record.Book == null)
            {
                return ApiResponse<object>.Fail("Không tìm thấy sách liên kết.");
            }

            if (record.Book.AvailableCopies <= 0)
            {
                return ApiResponse<object>.Fail("Sách này hiện không còn bản in khả dụng để duyệt mượn.");
            }

            // Check limit of MaxActiveBorrows from Configuration
            int maxActiveBorrowsLimit = _configuration.GetValue<int>("LibraryRules:MaxActiveBorrows", 5);
            var activeCount = await _context.BorrowRecords
                .CountAsync(r => r.UserId == record.UserId && (r.Status == BorrowRecordStatus.Borrowed || r.Status == BorrowRecordStatus.Overdue));

            if (activeCount >= maxActiveBorrowsLimit)
            {
                return ApiResponse<object>.Fail($"Thành viên này đã đạt giới hạn mượn {maxActiveBorrowsLimit} cuốn cùng lúc.");
            }

            record.Status = BorrowRecordStatus.Borrowed;
            record.ApprovedByUserId = loggedInUserId;
            record.BorrowDate = DateTime.UtcNow;
            record.DueDate = DateTime.UtcNow.AddDays(_configuration.GetValue<int>("LibraryRules:DefaultLoanDurationDays", 14));
            record.UpdatedAt = DateTime.UtcNow;
            record.Book.AvailableCopies--;

            // Fulfill reservation if exists
            var reservation = await _context.Reservations
                .FirstOrDefaultAsync(res => res.BookId == record.BookId && res.UserId == record.UserId && res.Status == "Available");
            if (reservation != null)
            {
                reservation.Status = "Fulfilled";
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return ApiResponse<object>.Fail("Sách này đang được xử lý hoặc cập nhật bởi một luồng khác. Vui lòng thử lại.");
            }

            return ApiResponse<object>.Ok(null!, "Phê duyệt yêu cầu mượn thành công.");
        }

        public async Task<ApiResponse<object>> RejectBorrowAsync(Guid id, string? notes)
        {
            var record = await _context.BorrowRecords.FindAsync(id);
            if (record == null)
            {
                return ApiResponse<object>.Fail("Không tìm thấy phiếu mượn.");
            }

            if (record.Status != BorrowRecordStatus.Pending)
            {
                return ApiResponse<object>.Fail("Phiếu mượn này đã được xử lý.");
            }

            record.Status = BorrowRecordStatus.Rejected;
            record.Notes = notes ?? "Thủ thư từ chối yêu cầu mượn.";
            record.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return ApiResponse<object>.Ok(null!, "Từ chối yêu cầu mượn thành công.");
        }

        public async Task<ApiResponse<object>> ReturnBookAsync(Guid id, Guid loggedInUserId, string loggedInUserRole)
        {
            var record = await _context.BorrowRecords
                .Include(r => r.Book)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (record == null)
            {
                return ApiResponse<object>.Fail("Không tìm thấy phiếu mượn.");
            }

            if (loggedInUserRole == "Member" && record.UserId != loggedInUserId)
            {
                return ApiResponse<object>.Fail("Bạn không có quyền hoàn trả sách của người khác.");
            }

            if (record.Status != BorrowRecordStatus.Borrowed && record.Status != BorrowRecordStatus.Overdue && record.Status != BorrowRecordStatus.ReturnPending)
            {
                return ApiResponse<object>.Fail("Sách này đã được trả hoặc chưa được duyệt mượn.");
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
                        decimal dailyFineAmount = _configuration.GetValue<decimal>("LibraryRules:DailyFineAmount", 5000);
                        fineAmount = diffDays * dailyFineAmount;
                    }
                }

                record.ReturnDate = returnDate;
                record.Status = BorrowRecordStatus.Returned;
                record.FineAmount = fineAmount;
                record.ReturnedToUserId = loggedInUserId;
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

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    return ApiResponse<object>.Fail("Sách này đang được xử lý hoặc cập nhật bởi một luồng khác. Vui lòng thử lại.");
                }

                var msg = fineAmount > 0
                    ? $"Duyệt trả sách thành công. Thành viên đã quá hạn trả và bị phạt {fineAmount.ToString("N0")} VNĐ."
                    : "Duyệt trả sách thành công.";

                return ApiResponse<object>.Ok(null!, msg);
            }
            else
            {
                // Member requesting return - set to ReturnPending
                record.Status = BorrowRecordStatus.ReturnPending;
                record.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return ApiResponse<object>.Ok(null!, "Gửi yêu cầu trả sách thành công, vui lòng chờ thủ thư kiểm duyệt.");
            }
        }

        public async Task<ApiResponse<object>> PayFineAsync(Guid id)
        {
            var record = await _context.BorrowRecords.FindAsync(id);
            if (record == null)
            {
                return ApiResponse<object>.Fail("Không tìm thấy phiếu mượn.");
            }

            if (record.FineAmount <= 0)
            {
                return ApiResponse<object>.Fail("Phiếu mượn này không có khoản phạt nào.");
            }

            if (record.IsFinePaid)
            {
                return ApiResponse<object>.Fail("Khoản phạt này đã được thanh toán rồi.");
            }

            record.IsFinePaid = true;
            await _context.SaveChangesAsync();

            return ApiResponse<object>.Ok(null!, "Đã thu tiền phạt thành công.");
        }
    }
}
