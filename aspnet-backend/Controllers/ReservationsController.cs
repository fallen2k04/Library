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
    [Route("api/reservations")]
    [Authorize]
    public class ReservationsController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public ReservationsController(LibraryDbContext context)
        {
            _context = context;
        }

        // POST: api/reservations
        [HttpPost]
        public async Task<IActionResult> CreateReservation([FromBody] ReservationRequestDto dto)
        {
            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var loggedInUserRole = User.FindFirstValue(ClaimTypes.Role);

            if (!Guid.TryParse(loggedInUserIdString, out var loggedInUserId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Phiên đăng nhập không hợp lệ."));
            }

            Guid targetUserId = loggedInUserId;

            if ((loggedInUserRole == "Admin" || loggedInUserRole == "Librarian") && dto.UserId.HasValue)
            {
                targetUserId = dto.UserId.Value;
            }

            var book = await _context.Books.FindAsync(dto.BookId);
            if (book == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy sách."));
            }

            // Rule 5: Chỉ được đặt khi Book.AvailableCopies == 0
            if (book.AvailableCopies > 0)
            {
                return BadRequest(ApiResponse<object>.Fail("Sách vẫn còn bản in sẵn có. Bạn có thể mượn trực tiếp mà không cần đặt trước."));
            }

            var alreadyReserved = await _context.Reservations
                .AnyAsync(r => r.BookId == dto.BookId && r.UserId == targetUserId && (r.Status == "Waiting" || r.Status == "Available"));

            if (alreadyReserved)
            {
                return BadRequest(ApiResponse<object>.Fail("Bạn đã đăng ký đặt trước cuốn sách này từ trước rồi."));
            }

            var waitingCount = await _context.Reservations
                .CountAsync(r => r.BookId == dto.BookId && r.Status == "Waiting");

            var queuePosition = waitingCount + 1;

            var reservation = new Reservation
            {
                UserId = targetUserId,
                BookId = dto.BookId,
                ReservationDate = DateTime.UtcNow,
                ExpiryDate = DateTime.UtcNow.AddDays(14), // Expiry 14 days by default for waiting
                Status = "Waiting",
                QueuePosition = queuePosition
            };

            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<Reservation>.Ok(reservation, $"Đặt trước sách thành công. Vị trí hàng đợi: {queuePosition}"));
        }

        // GET: api/reservations/my-reservations
        [HttpGet("my-reservations")]
        public async Task<IActionResult> GetMyReservations()
        {
            var loggedInUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(loggedInUserId, out var userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Phiên hoạt động không hợp lệ."));
            }

            var list = await _context.Reservations
                .Include(r => r.Book)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.ReservationDate)
                .Select(r => new ReservationDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    BookId = r.BookId,
                    ReservationDate = r.ReservationDate,
                    ExpiryDate = r.ExpiryDate,
                    Status = r.Status,
                    QueuePosition = r.QueuePosition,
                    BookDetail = r.Book != null ? new BookDto
                    {
                        Id = r.Book.Id,
                        Title = r.Book.Title,
                        ISBN = r.Book.ISBN,
                        CoverImageUrl = r.Book.CoverImageUrl
                    } : null
                })
                .ToListAsync();

            return Ok(ApiResponse<List<ReservationDto>>.Ok(list, "Lấy danh sách đặt trước cá nhân thành công."));
        }

        // PUT: api/reservations/{id}/cancel
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelReservation(Guid id)
        {
            var reservation = await _context.Reservations.FindAsync(id);
            if (reservation == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy thông tin đặt trước."));
            }

            var loggedInUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var loggedInUserRole = User.FindFirstValue(ClaimTypes.Role);

            if (loggedInUserRole != "Admin" && loggedInUserRole != "Librarian" && reservation.UserId.ToString() != loggedInUserId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Bạn không có quyền hủy đặt trước của người khác."));
            }

            var oldStatus = reservation.Status;
            reservation.Status = "Cancelled";
            reservation.QueuePosition = 0;

            await _context.SaveChangesAsync();

            // Re-index remaining reservations for the same book
            if (oldStatus == "Waiting")
            {
                var siblings = await _context.Reservations
                    .Where(r => r.BookId == reservation.BookId && r.Status == "Waiting" && r.Id != id)
                    .OrderBy(r => r.QueuePosition)
                    .ToListAsync();

                for (int i = 0; i < siblings.Count; i++)
                {
                    siblings[i].QueuePosition = i + 1;
                }
                await _context.SaveChangesAsync();
            }
            else if (oldStatus == "Available")
            {
                // Shift next waiting reservation to Available
                var siblings = await _context.Reservations
                    .Where(r => r.BookId == reservation.BookId && r.Status == "Waiting")
                    .OrderBy(r => r.QueuePosition)
                    .ToListAsync();

                if (siblings.Count > 0)
                {
                    var nextRes = siblings[0];
                    nextRes.Status = "Available";
                    nextRes.ExpiryDate = DateTime.UtcNow.AddDays(3);

                    for (int i = 0; i < siblings.Count; i++)
                    {
                        siblings[i].QueuePosition = i + 1;
                    }
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(ApiResponse<object>.Ok(null!, "Hủy đặt trước thành công."));
        }
    }
}
