using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuminaLibrary.Infrastructure;
using LuminaLibrary.Domain;
using LuminaLibrary.Application;

namespace LuminaLibrary.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public UsersController(LibraryDbContext context)
        {
            _context = context;
        }

        // GET: api/users/librarians
        [HttpGet("librarians")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLibrarians()
        {
            var librarians = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.Name == "Librarian")
                .Select(u => new
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Role = u.Role != null ? u.Role.Name : "Librarian"
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(librarians, "Lấy danh sách thủ thư thành công."));
        }

        // GET: api/users
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? role = null,
            [FromQuery] bool? isLocked = null)
        {
            var query = _context.Users
                .Include(u => u.Role)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(u => u.FullName.ToLower().Contains(lowerSearch) ||
                                         u.Email.ToLower().Contains(lowerSearch) ||
                                         (u.PhoneNumber != null && u.PhoneNumber.Contains(lowerSearch)));
            }

            if (!string.IsNullOrEmpty(role))
            {
                query = query.Where(u => u.Role != null && u.Role.Name == role);
            }

            if (isLocked.HasValue)
            {
                query = query.Where(u => u.IsLocked == isLocked.Value);
            }

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var users = await query.OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    Role = u.Role != null ? u.Role.Name : "Guest",
                    MembershipTier = u.MembershipTier,
                    IsLocked = u.IsLocked,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            var response = ApiResponse<List<UserDto>>.Ok(users, "Lấy danh sách người dùng thành công.");
            response.Pagination = new PaginationInfo
            {
                CurrentPage = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages
            };

            return Ok(response);
        }

        // GET: api/users/me
        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Phiên đăng nhập không hợp lệ."));
            }

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy thông tin tài khoản."));
            }

            var dto = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role?.Name ?? "Guest",
                MembershipTier = user.MembershipTier,
                IsLocked = user.IsLocked,
                CreatedAt = user.CreatedAt
            };

            return Ok(ApiResponse<UserDto>.Ok(dto, "Lấy thông tin tài khoản thành công."));
        }

        // GET: api/users/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(Guid id)
        {
            var loggedInUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var loggedInUserRole = User.FindFirstValue(ClaimTypes.Role);

            if (loggedInUserRole != "Admin" && loggedInUserId != id.ToString())
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Bạn không có quyền truy cập thông tin này."));
            }

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy người dùng."));
            }

            var dto = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role?.Name ?? "Guest",
                MembershipTier = user.MembershipTier,
                IsLocked = user.IsLocked,
                CreatedAt = user.CreatedAt
            };

            return Ok(ApiResponse<UserDto>.Ok(dto, "Lấy chi tiết người dùng thành công."));
        }

        // PUT: api/users/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] RegisterDto dto)
        {
            var loggedInUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var loggedInUserRole = User.FindFirstValue(ClaimTypes.Role);

            if (loggedInUserRole != "Admin" && loggedInUserId != id.ToString())
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Bạn không có quyền chỉnh sửa thông tin này."));
            }

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy người dùng."));
            }

            user.FullName = dto.FullName;
            if (user.Email.ToLower() != dto.Email.ToLower())
            {
                if (await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower() && u.Id != id))
                {
                    return BadRequest(ApiResponse<object>.Fail("Email đã được sử dụng bởi một tài khoản khác."));
                }
                user.Email = dto.Email.ToLower();
            }
            user.PhoneNumber = dto.PhoneNumber;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var userDto = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role?.Name ?? "Guest",
                MembershipTier = user.MembershipTier,
                IsLocked = user.IsLocked,
                CreatedAt = user.CreatedAt
            };

            return Ok(ApiResponse<UserDto>.Ok(userDto, "Cập nhật thông tin thành công."));
        }

        // PUT: api/users/{id}/role
        [HttpPut("{id}/role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateRoleDto dto)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy người dùng."));
            }

            var targetRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == dto.Role);
            if (targetRole == null)
            {
                return BadRequest(ApiResponse<object>.Fail("Vai trò chỉnh sửa không hợp lệ."));
            }

            user.RoleId = targetRole.Id;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var userDto = new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = targetRole.Name,
                MembershipTier = user.MembershipTier,
                IsLocked = user.IsLocked,
                CreatedAt = user.CreatedAt
            };

            return Ok(ApiResponse<UserDto>.Ok(userDto, "Thay đổi vai trò thành công."));
        }

        // PUT: api/users/{id}/lock
        [HttpPut("{id}/lock")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> LockUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy người dùng."));
            }

            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
            if (user.RoleId == adminRole?.Id)
            {
                return BadRequest(ApiResponse<object>.Fail("Không thể khóa tài khoản Admin."));
            }

            user.IsLocked = true;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.Ok(null!, "Đã khóa tài khoản thành công."));
        }

        // PUT: api/users/{id}/unlock
        [HttpPut("{id}/unlock")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UnlockUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy người dùng."));
            }

            user.IsLocked = false;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.Ok(null!, "Đã mở khóa tài khoản thành công."));
        }

        // DELETE: api/users/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy người dùng."));
            }

            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
            if (user.RoleId == adminRole?.Id)
            {
                return BadRequest(ApiResponse<object>.Fail("Không thể xóa tài khoản Admin."));
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.Ok(null!, "Đã xóa người dùng thành công."));
        }

        // POST: api/users/verify-password
        [HttpPost("verify-password")]
        public async Task<IActionResult> VerifyPassword([FromBody] VerifyPasswordDto dto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Không xác định được danh tính người dùng."));
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy người dùng."));
            }

            bool isPasswordCorrect = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!isPasswordCorrect)
            {
                return BadRequest(ApiResponse<object>.Fail("Mật khẩu không chính xác."));
            }

            var otp = new Random().Next(100000, 999999).ToString();
            return Ok(ApiResponse<object>.Ok(new { OtpCode = otp }, "Mật khẩu chính xác. Mã OTP đã được gửi."));
        }
    }

    public class VerifyPasswordDto
    {
        public string Password { get; set; } = string.Empty;
    }
}
