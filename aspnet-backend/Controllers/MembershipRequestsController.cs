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
    [Route("api/membership-requests")]
    [Authorize]
    public class MembershipRequestsController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public MembershipRequestsController(LibraryDbContext context)
        {
            _context = context;
        }

        // GET: api/membership-requests
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRequests()
        {
            var list = await _context.MembershipRequests
                .Include(r => r.User)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new MembershipRequestDetailDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    TierName = r.TierName,
                    Price = r.Price,
                    PaymentMethod = r.PaymentMethod,
                    Status = r.Status,
                    CreatedAt = r.CreatedAt,
                    UserDetail = r.User != null ? new UserDto
                    {
                        Id = r.User.Id,
                        FullName = r.User.FullName,
                        Email = r.User.Email
                    } : null
                })
                .ToListAsync();

            return Ok(ApiResponse<List<MembershipRequestDetailDto>>.Ok(list, "Lấy danh sách yêu cầu thành công."));
        }

        // POST: api/membership-requests
        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] MembershipRequestDto dto)
        {
            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(loggedInUserIdString, out var loggedInUserId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Phiên hoạt động không hợp lệ."));
            }

            var request = new MembershipRequest
            {
                UserId = loggedInUserId,
                TierName = dto.TierName,
                Price = dto.Price,
                PaymentMethod = dto.PaymentMethod,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.MembershipRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(null!, "Yêu cầu nâng cấp gói đã được gửi tới quản trị viên phê duyệt."));
        }

        // PUT: api/membership-requests/{id}/status
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateMembershipRequestStatusDto dto)
        {
            var request = await _context.MembershipRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy yêu cầu nâng cấp."));
            }

            if (request.Status != "Pending")
            {
                return BadRequest(ApiResponse<object>.Fail("Yêu cầu này đã được xử lý."));
            }

            if (dto.Status != "Approved" && dto.Status != "Rejected")
            {
                return BadRequest(ApiResponse<object>.Fail("Trạng thái phê duyệt không hợp lệ."));
            }

            request.Status = dto.Status;
            if (dto.Status == "Approved")
            {
                var user = await _context.Users.FindAsync(request.UserId);
                if (user != null)
                {
                    user.MembershipTier = request.TierName;
                }
            }
            await _context.SaveChangesAsync();

            var statusMsg = dto.Status == "Approved" ? "phê duyệt" : "từ chối";
            return Ok(ApiResponse<object>.Ok(null!, $"Đã {statusMsg} yêu cầu nâng cấp thành công."));
        }
    }
}
