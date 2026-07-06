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
    [Route("api/space-reservations")]
    [Authorize]
    public class SpaceReservationsController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public SpaceReservationsController(LibraryDbContext context)
        {
            _context = context;
        }

        // POST: api/space-reservations
        [HttpPost]
        public async Task<IActionResult> BookSpace([FromBody] BookSpaceDto dto)
        {
            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(loggedInUserIdString) || !Guid.TryParse(loggedInUserIdString, out var userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Không xác định được danh tính người dùng."));
            }

            if (string.IsNullOrEmpty(dto.SpaceType))
            {
                return BadRequest(ApiResponse<object>.Fail("Vui lòng chọn loại phòng học."));
            }

            var ticketNumber = "SPC-" + Random.Shared.Next(100000, 999999);
            var pinCode = "LUM-" + Random.Shared.Next(1000, 9999);

            var reservation = new SpaceReservation
            {
                UserId = userId,
                SpaceType = dto.SpaceType,
                Date = dto.Date,
                Time = dto.Time,
                TicketNumber = ticketNumber,
                Code = pinCode
            };

            _context.SpaceReservations.Add(reservation);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<SpaceReservation>.Ok(reservation, "Đặt chỗ phòng tự học thành công."));
        }

        // GET: api/space-reservations/my
        [HttpGet("my")]
        public async Task<IActionResult> GetMySpaceReservations()
        {
            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(loggedInUserIdString) || !Guid.TryParse(loggedInUserIdString, out var userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Không xác định được danh tính người dùng."));
            }

            var list = await _context.SpaceReservations
                .Where(sr => sr.UserId == userId)
                .OrderByDescending(sr => sr.CreatedAt)
                .ToListAsync();

            return Ok(ApiResponse<List<SpaceReservation>>.Ok(list, "Lấy danh sách đặt phòng tự học thành công."));
        }

        // GET: api/space-reservations (Admin only)
        [HttpGet]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> GetAllSpaceReservations()
        {
            var list = await _context.SpaceReservations
                .Include(sr => sr.User)
                .OrderByDescending(sr => sr.CreatedAt)
                .Select(sr => new
                {
                    sr.Id,
                    sr.UserId,
                    sr.SpaceType,
                    sr.Date,
                    sr.Time,
                    sr.TicketNumber,
                    sr.Code,
                    sr.CreatedAt,
                    UserFullName = sr.User != null ? sr.User.FullName : "N/A",
                    UserEmail = sr.User != null ? sr.User.Email : "N/A"
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(list, "Lấy danh sách tất cả đặt phòng thành công."));
        }
    }

    public class BookSpaceDto
    {
        public string SpaceType { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Time { get; set; } = string.Empty;
    }
}
