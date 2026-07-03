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
    [Route("api/events")]
    public class EventsController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public EventsController(LibraryDbContext context)
        {
            _context = context;
        }

        // GET: api/events
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetEvents()
        {
            var events = await _context.Events
                .Include(e => e.Speakers)
                .Include(e => e.Schedule)
                .Include(e => e.Reviews)
                .OrderByDescending(e => e.Date)
                .ToListAsync();

            var currentUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid? currentUserId = null;
            if (Guid.TryParse(currentUserIdString, out var parsedId))
            {
                currentUserId = parsedId;
            }

            var dtos = new List<EventDto>();
            foreach (var e in events)
            {
                bool isRegistered = false;
                if (currentUserId.HasValue)
                {
                    isRegistered = await _context.EventRegistrations
                        .AnyAsync(r => r.EventId == e.Id && r.UserId == currentUserId.Value);
                }

                dtos.Add(new EventDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Tag = e.Tag,
                    Status = e.Status,
                    Description = e.Description,
                    LongDescription = e.LongDescription,
                    Date = e.Date,
                    Location = e.Location,
                    RegisteredCount = e.RegisteredCount,
                    MaxCapacity = e.MaxCapacity,
                    ImageUrl = e.ImageUrl,
                    Fee = e.Fee,
                    Host = e.Host,
                    Deadline = e.Deadline,
                    Rating = e.Rating,
                    IsRegistered = isRegistered,
                    Speakers = e.Speakers.Select(s => new SpeakerDto { Id = s.Id, Name = s.Name, Title = s.Title, ImageUrl = s.ImageUrl }).ToList(),
                    Schedule = e.Schedule.Select(sc => new ScheduleDto { Id = sc.Id, Time = sc.Time, Title = sc.Title, Description = sc.Description }).ToList(),
                    Reviews = e.Reviews.Select(r => new ReviewDto { Id = r.Id, User = r.User, Avatar = r.Avatar, Text = r.Text, Time = r.Time, Likes = r.Likes }).ToList()
                });
            }

            return Ok(ApiResponse<List<EventDto>>.Ok(dtos, "Lấy danh sách sự kiện thành công."));
        }

        // POST: api/events
        [HttpPost]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto dto)
        {
            var newEvent = new LibraryEvent
            {
                Title = dto.Title,
                Tag = dto.Tag,
                Status = "Upcoming",
                Description = dto.Description,
                LongDescription = dto.LongDescription,
                Date = dto.Date,
                Location = dto.Location,
                MaxCapacity = dto.MaxCapacity,
                ImageUrl = string.IsNullOrEmpty(dto.ImageUrl)
                    ? "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600"
                    : dto.ImageUrl,
                Fee = dto.Fee ?? "Free",
                Host = dto.Host ?? "Thư viện Lumina",
                Deadline = dto.Deadline ?? dto.Date.AddDays(-1)
            };

            _context.Events.Add(newEvent);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<LibraryEvent>.Ok(newEvent, "Thêm sự kiện thành công."));
        }

        // POST: api/events/{id}/register
        [HttpPost("{id}/register")]
        [Authorize]
        public async Task<IActionResult> RegisterEvent(Guid id)
        {
            var targetEvent = await _context.Events.FindAsync(id);
            if (targetEvent == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy sự kiện này."));
            }

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Phiên hoạt động không hợp lệ."));
            }

            var alreadyRegistered = await _context.EventRegistrations
                .AnyAsync(r => r.EventId == id && r.UserId == userId);

            if (alreadyRegistered)
            {
                return BadRequest(ApiResponse<object>.Fail("Bạn đã đăng ký tham gia sự kiện này rồi."));
            }

            if (targetEvent.RegisteredCount >= targetEvent.MaxCapacity)
            {
                return BadRequest(ApiResponse<object>.Fail("Sự kiện hiện tại đã đầy chỗ."));
            }

            var reg = new EventRegistration
            {
                EventId = id,
                UserId = userId,
                RegistrationDate = DateTime.UtcNow
            };

            _context.EventRegistrations.Add(reg);
            targetEvent.RegisteredCount++;

            await _context.SaveChangesAsync();

            var data = new { registeredCount = targetEvent.RegisteredCount };
            return Ok(ApiResponse<object>.Ok(data, "Đăng ký tham gia sự kiện thành công."));
        }

        // POST: api/events/{id}/reviews
        [HttpPost("{id}/reviews")]
        [Authorize]
        public async Task<IActionResult> PostReview(Guid id, [FromBody] CreateReviewDto dto)
        {
            var targetEvent = await _context.Events.FindAsync(id);
            if (targetEvent == null)
            {
                return NotFound(ApiResponse<object>.Fail("Sự kiện không tồn tại."));
            }

            var userName = User.FindFirstValue(ClaimTypes.Name) ?? "Độc giả ẩn danh";

            var review = new EventReview
            {
                EventId = id,
                User = userName,
                Avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
                Text = dto.Text,
                Time = "Vừa xong",
                Likes = 0
            };

            _context.EventReviews.Add(review);
            await _context.SaveChangesAsync();

            var result = new ReviewDto
            {
                Id = review.Id,
                User = review.User,
                Avatar = review.Avatar,
                Text = review.Text,
                Time = review.Time,
                Likes = review.Likes
            };

            return Ok(ApiResponse<ReviewDto>.Ok(result, "Đăng bình luận thành công."));
        }

        // POST: api/events/reviews/{reviewId}/like
        [HttpPost("reviews/{reviewId}/like")]
        [Authorize]
        public async Task<IActionResult> LikeReview(Guid reviewId)
        {
            var review = await _context.EventReviews.FindAsync(reviewId);
            if (review == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy bình luận."));
            }

            review.Likes++;
            await _context.SaveChangesAsync();

            var data = new { likes = review.Likes };
            return Ok(ApiResponse<object>.Ok(data, "Đã thích bình luận."));
        }
    }
}
