using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuminaLibrary.Infrastructure;
using LuminaLibrary.Domain;
using LuminaLibrary.Application;
using LuminaLibrary.Services;

namespace LuminaLibrary.Controllers
{
    [ApiController]
    [Route("api/borrow-records")]
    [Authorize]
    public class CirculationController : ControllerBase
    {
        private readonly LibraryDbContext _context;
        private readonly ICirculationService _circulationService;

        public CirculationController(LibraryDbContext context, ICirculationService circulationService)
        {
            _context = context;
            _circulationService = circulationService;
        }

        // POST: api/borrow-records
        [HttpPost]
        public async Task<IActionResult> CreateBorrow([FromBody] BorrowRequestDto dto)
        {
            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var loggedInUserRole = User.FindFirstValue(ClaimTypes.Role);

            if (!Guid.TryParse(loggedInUserIdString, out var loggedInUserId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Phiên đăng nhập không hợp lệ."));
            }

            var result = await _circulationService.CreateBorrowAsync(dto, loggedInUserId, loggedInUserRole ?? "Member");
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // PUT: api/borrow-records/{id}/approve
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> ApproveBorrow(Guid id)
        {
            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(loggedInUserIdString, out var loggedInUserId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Phiên đăng nhập không hợp lệ."));
            }

            var result = await _circulationService.ApproveBorrowAsync(id, loggedInUserId);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // PUT: api/borrow-records/{id}/reject
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> RejectBorrow(Guid id, [FromBody] string? notes)
        {
            var result = await _circulationService.RejectBorrowAsync(id, notes);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // PUT: api/borrow-records/{id}/return
        [HttpPut("{id}/return")]
        public async Task<IActionResult> ReturnBook(Guid id)
        {
            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var loggedInUserRole = User.FindFirstValue(ClaimTypes.Role);

            if (!Guid.TryParse(loggedInUserIdString, out var loggedInUserId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Phiên đăng nhập không hợp lệ."));
            }

            var result = await _circulationService.ReturnBookAsync(id, loggedInUserId, loggedInUserRole ?? "Member");
            if (!result.Success)
            {
                if (result.Message == "Bạn không có quyền hoàn trả sách của người khác.")
                {
                    return StatusCode(StatusCodes.Status403Forbidden, result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }

        // PUT: api/borrow-records/{id}/pay-fine
        [HttpPut("{id}/pay-fine")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> PayFine(Guid id)
        {
            var result = await _circulationService.PayFineAsync(id);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
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
            var query = _context.BorrowRecords
                .Include(r => r.Book)
                .Include(r => r.User)
                    .ThenInclude(u => u!.Role)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<BorrowRecordStatus>(status, true, out var statusEnum))
            {
                query = query.Where(r => r.Status == statusEnum);
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
                    Status = r.Status.ToString(),
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
            var loggedInUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(loggedInUserId, out var userId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Phiên hoạt động không hợp lệ."));
            }

            var query = _context.BorrowRecords
                .Include(r => r.Book)
                .Where(r => r.UserId == userId)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<BorrowRecordStatus>(status, true, out var statusEnum))
            {
                query = query.Where(r => r.Status == statusEnum);
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
                    Status = r.Status.ToString(),
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
            var list = await _context.BorrowRecords
                .Include(r => r.Book)
                .Include(r => r.User)
                .Where(r => r.Status == BorrowRecordStatus.Overdue || (r.Status == BorrowRecordStatus.Returned && r.FineAmount > 0 && !r.IsFinePaid))
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new BorrowRecordDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    BookId = r.BookId,
                    BorrowDate = r.BorrowDate,
                    DueDate = r.DueDate,
                    ReturnDate = r.ReturnDate,
                    Status = r.Status.ToString(),
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
            var list = await _context.BorrowRecords
                .Include(r => r.Book)
                .Include(r => r.User)
                .Where(r => r.Status == BorrowRecordStatus.Borrowed || r.Status == BorrowRecordStatus.Overdue)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new BorrowRecordDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    BookId = r.BookId,
                    BorrowDate = r.BorrowDate,
                    DueDate = r.DueDate,
                    Status = r.Status.ToString(),
                    BookDetail = r.Book != null ? new BookDto { Id = r.Book.Id, Title = r.Book.Title, ISBN = r.Book.ISBN, CoverImageUrl = r.Book.CoverImageUrl } : null,
                    UserDetail = r.User != null ? new UserDto { Id = r.User.Id, FullName = r.User.FullName, Email = r.User.Email } : null
                })
                .ToListAsync();

            return Ok(ApiResponse<List<BorrowRecordDto>>.Ok(list, "Sách đang được mượn trên hệ thống."));
        }
    }
}
