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
    [Route("api/consultations")]
    [Authorize]
    public class ConsultationsController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public ConsultationsController(LibraryDbContext context)
        {
            _context = context;
        }

        // POST: api/consultations
        [HttpPost]
        public async Task<IActionResult> BookConsultation([FromBody] BookConsultationDto dto)
        {
            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(loggedInUserIdString) || !Guid.TryParse(loggedInUserIdString, out var userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Không xác định được danh tính người dùng."));
            }

            if (string.IsNullOrEmpty(dto.LibrarianName) || string.IsNullOrEmpty(dto.Subject))
            {
                return BadRequest(ApiResponse<object>.Fail("Vui lòng nhập đầy đủ thông tin yêu cầu."));
            }

            var ticketNumber = "LBR-" + Random.Shared.Next(100000, 999999);

            var consultation = new LibrarianConsultation
            {
                UserId = userId,
                LibrarianName = dto.LibrarianName,
                Subject = dto.Subject,
                Date = dto.Date,
                Time = dto.Time,
                TicketNumber = ticketNumber
            };

            _context.LibrarianConsultations.Add(consultation);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<LibrarianConsultation>.Ok(consultation, "Đăng ký cuộc hẹn với thủ thư thành công."));
        }

        // GET: api/consultations/my
        [HttpGet("my")]
        public async Task<IActionResult> GetMyConsultations()
        {
            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(loggedInUserIdString) || !Guid.TryParse(loggedInUserIdString, out var userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Không xác định được danh tính người dùng."));
            }

            var list = await _context.LibrarianConsultations
                .Where(lc => lc.UserId == userId)
                .OrderByDescending(lc => lc.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<List<LibrarianConsultation>>.Ok(list, "Lấy danh sách lịch hẹn thành công."));
        }

        // GET: api/consultations (Admin only)
        [HttpGet]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> GetAllConsultations()
        {
            var list = await _context.LibrarianConsultations
                .Include(lc => lc.User)
                .OrderByDescending(lc => lc.CreatedAt)
                .Select(lc => new
                {
                    lc.Id,
                    lc.UserId,
                    lc.LibrarianName,
                    lc.Subject,
                    lc.Date,
                    lc.Time,
                    lc.TicketNumber,
                    lc.Status,
                    lc.CreatedAt,
                    UserFullName = lc.User != null ? lc.User.FullName : "N/A",
                    UserEmail = lc.User != null ? lc.User.Email : "N/A"
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(list, "Lấy danh sách tất cả cuộc hẹn thành công."));
        }

        // PUT: api/consultations/{id}/approve
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> ApproveConsultation(Guid id)
        {
            var consultation = await _context.LibrarianConsultations.FindAsync(id);
            if (consultation == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy lịch hẹn."));
            }

            consultation.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(null!, "Duyệt lịch hẹn thành công."));
        }

        // PUT: api/consultations/{id}/reject
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> RejectConsultation(Guid id)
        {
            var consultation = await _context.LibrarianConsultations.FindAsync(id);
            if (consultation == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy lịch hẹn."));
            }

            consultation.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(null!, "Từ chối lịch hẹn thành công."));
        }
    }

    public class BookConsultationDto
    {
        public string LibrarianName { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Time { get; set; } = string.Empty;
    }
}
