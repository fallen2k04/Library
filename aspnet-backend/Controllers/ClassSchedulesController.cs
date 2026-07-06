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
    [Route("api/classes")]
    [Authorize]
    public class ClassSchedulesController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public ClassSchedulesController(LibraryDbContext context)
        {
            _context = context;
        }

        // POST: api/classes (Admin/Librarian creates class)
        [HttpPost]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> CreateClass([FromBody] CreateClassDto dto)
        {
            if (string.IsNullOrEmpty(dto.Title) || string.IsNullOrEmpty(dto.Instructor))
            {
                return BadRequest(ApiResponse<object>.Fail("Vui lòng cung cấp tiêu đề lớp học và người hướng dẫn."));
            }

            var limitDate = DateTime.UtcNow.AddMonths(1);
            if (dto.Date < DateTime.UtcNow.Date || dto.Date > limitDate)
            {
                return BadRequest(ApiResponse<object>.Fail("Ngày lên lịch lớp học phải nằm trong vòng 1 tháng từ hôm nay."));
            }

            var classSchedule = new ClassSchedule
            {
                Title = dto.Title,
                Instructor = dto.Instructor,
                Date = dto.Date,
                Time = dto.Time,
                MaxCapacity = dto.MaxCapacity,
                Description = dto.Description
            };

            _context.ClassSchedules.Add(classSchedule);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<ClassSchedule>.Ok(classSchedule, "Lên lịch lớp học thành công."));
        }

        // GET: api/classes (Fetch available class schedules within 1 month)
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetClasses()
        {
            var today = DateTime.UtcNow.Date;
            var oneMonthLater = today.AddMonths(1);

            var list = await _context.ClassSchedules
                .Where(c => c.Date >= today && c.Date <= oneMonthLater)
                .OrderBy(c => c.Date)
                .ToListAsync();

            return Ok(ApiResponse<List<ClassSchedule>>.Ok(list, "Lấy danh sách lớp học thành công."));
        }

        // POST: api/classes/{id}/register (User registers for a class)
        [HttpPost("{id}/register")]
        public async Task<IActionResult> RegisterForClass(Guid id)
        {
            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(loggedInUserIdString) || !Guid.TryParse(loggedInUserIdString, out var userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Không xác định được danh tính người dùng."));
            }

            var classSchedule = await _context.ClassSchedules.FindAsync(id);
            if (classSchedule == null)
            {
                return NotFound(ApiResponse<object>.Fail("Lớp học không tồn tại."));
            }

            if (classSchedule.RegisteredCount >= classSchedule.MaxCapacity)
            {
                return BadRequest(ApiResponse<object>.Fail("Lớp học này đã đủ số lượng thành viên đăng ký."));
            }

            var alreadyRegistered = await _context.ClassRegistrations
                .AnyAsync(r => r.ClassScheduleId == id && r.UserId == userId);
            if (alreadyRegistered)
            {
                return BadRequest(ApiResponse<object>.Fail("Bạn đã đăng ký tham gia lớp học này rồi."));
            }

            var registration = new ClassRegistration
            {
                ClassScheduleId = id,
                UserId = userId
            };

            classSchedule.RegisteredCount += 1;

            _context.ClassRegistrations.Add(registration);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(null!, "Đăng ký tham gia lớp học thành công."));
        }

        // GET: api/classes/my (User's registered classes)
        [HttpGet("my")]
        public async Task<IActionResult> GetMyClasses()
        {
            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(loggedInUserIdString) || !Guid.TryParse(loggedInUserIdString, out var userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Không xác định được danh tính người dùng."));
            }

            var registrations = await _context.ClassRegistrations
                .Include(r => r.ClassSchedule)
                .Where(r => r.UserId == userId)
                .OrderBy(r => r.RegistrationDate)
                .Select(r => r.ClassSchedule)
                .ToListAsync();

            return Ok(ApiResponse<List<ClassSchedule>>.Ok(registrations!, "Lấy danh sách lớp học của tôi thành công."));
        }

        // GET: api/classes/registrations (Admin/Librarian gets all registrations)
        [HttpGet("registrations")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> GetAllRegistrations()
        {
            var list = await _context.ClassRegistrations
                .Include(r => r.ClassSchedule)
                .Include(r => r.User)
                .OrderByDescending(r => r.RegistrationDate)
                .Select(r => new
                {
                    r.Id,
                    r.ClassScheduleId,
                    r.UserId,
                    r.RegistrationDate,
                    ClassTitle = r.ClassSchedule != null ? r.ClassSchedule.Title : "N/A",
                    ClassInstructor = r.ClassSchedule != null ? r.ClassSchedule.Instructor : "N/A",
                    ClassDate = r.ClassSchedule != null ? (DateTime?)r.ClassSchedule.Date : null,
                    ClassTime = r.ClassSchedule != null ? r.ClassSchedule.Time : "N/A",
                    UserFullName = r.User != null ? r.User.FullName : "N/A",
                    UserEmail = r.User != null ? r.User.Email : "N/A"
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(list, "Lấy danh sách đăng ký lớp học thành công."));
        }
    }

    public class CreateClassDto
    {
        public string Title { get; set; } = string.Empty;
        public string Instructor { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Time { get; set; } = string.Empty;
        public int MaxCapacity { get; set; } = 30;
        public string? Description { get; set; }
    }
}
