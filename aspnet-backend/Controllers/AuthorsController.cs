using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LuminaLibrary.Infrastructure;
using LuminaLibrary.Domain;
using LuminaLibrary.Application;

namespace LuminaLibrary.Controllers
{
    [ApiController]
    [Route("api/authors")]
    public class AuthorsController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public AuthorsController(LibraryDbContext context)
        {
            _context = context;
        }

        // GET: api/authors
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAuthors(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 100,
            [FromQuery] string? search = null)
        {
            var query = _context.Authors.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(a => a.FullName.ToLower().Contains(lowerSearch) ||
                                         (a.Biography != null && a.Biography.ToLower().Contains(lowerSearch)));
            }

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var authors = await query.OrderBy(a => a.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AuthorDto
                {
                    Id = a.Id,
                    FullName = a.FullName,
                    Biography = a.Biography,
                    DateOfBirth = a.DateOfBirth,
                    Nationality = a.Nationality
                })
                .ToListAsync();

            var response = ApiResponse<List<AuthorDto>>.Ok(authors, "Lấy danh sách tác giả thành công.");
            response.Pagination = new PaginationInfo
            {
                CurrentPage = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages
            };

            return Ok(response);
        }

        // GET: api/authors/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAuthor(Guid id)
        {
            var author = await _context.Authors.FindAsync(id);
            if (author == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy tác giả."));
            }

            var dto = new AuthorDto
            {
                Id = author.Id,
                FullName = author.FullName,
                Biography = author.Biography,
                DateOfBirth = author.DateOfBirth,
                Nationality = author.Nationality
            };

            return Ok(ApiResponse<AuthorDto>.Ok(dto, "Chi tiết tác giả."));
        }

        // POST: api/authors
        [HttpPost]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> CreateAuthor([FromBody] CreateAuthorDto dto)
        {
            var author = new Author
            {
                FullName = dto.FullName,
                Biography = dto.Biography,
                DateOfBirth = dto.DateOfBirth,
                Nationality = dto.Nationality
            };

            _context.Authors.Add(author);
            await _context.SaveChangesAsync();

            var resultDto = new AuthorDto
            {
                Id = author.Id,
                FullName = author.FullName,
                Biography = author.Biography,
                DateOfBirth = author.DateOfBirth,
                Nationality = author.Nationality
            };

            return CreatedAtAction(nameof(GetAuthor), new { id = author.Id }, ApiResponse<AuthorDto>.Ok(resultDto, "Thêm tác giả thành công."));
        }

        // PUT: api/authors/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> UpdateAuthor(Guid id, [FromBody] CreateAuthorDto dto)
        {
            var author = await _context.Authors.FindAsync(id);
            if (author == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy tác giả."));
            }

            author.FullName = dto.FullName;
            author.Biography = dto.Biography;
            author.DateOfBirth = dto.DateOfBirth;
            author.Nationality = dto.Nationality;

            await _context.SaveChangesAsync();

            var resultDto = new AuthorDto
            {
                Id = author.Id,
                FullName = author.FullName,
                Biography = author.Biography,
                DateOfBirth = author.DateOfBirth,
                Nationality = author.Nationality
            };

            return Ok(ApiResponse<AuthorDto>.Ok(resultDto, "Cập nhật tác giả thành công."));
        }

        // DELETE: api/authors/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> DeleteAuthor(Guid id)
        {
            var author = await _context.Authors.FindAsync(id);
            if (author == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy tác giả."));
            }

            var hasBooks = await _context.BookAuthors.AnyAsync(ba => ba.AuthorId == id);
            if (hasBooks)
            {
                return BadRequest(ApiResponse<object>.Fail("Không thể xóa tác giả đang có liên kết với sách."));
            }

            _context.Authors.Remove(author);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(null!, "Xóa tác giả thành công."));
        }
    }
}
