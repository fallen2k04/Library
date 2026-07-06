using System;
using System.Collections.Generic;
using System.Linq;
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
    [Route("api/books")]
    public class BooksController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public BooksController(LibraryDbContext context)
        {
            _context = context;
        }

        // GET: api/books
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetBooks(
            [FromQuery] string? search = null,
            [FromQuery] Guid? categoryId = null,
            [FromQuery] Guid? authorId = null,
            [FromQuery] string sortBy = "createdAt",
            [FromQuery] string sortDir = "desc",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12)
        {
            var query = _context.Books
                .Include(b => b.Category)
                .Include(b => b.BookAuthors)
                    .ThenInclude(ba => ba.Author)
                .AsQueryable();

            // Lọc theo từ khóa tìm kiếm (khớp đầu từ để tìm kiếm chính xác)
            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(b => b.Title.ToLower().StartsWith(lowerSearch) ||
                                         b.Title.ToLower().Contains(" " + lowerSearch) ||
                                         b.ISBN.Contains(lowerSearch) ||
                                         b.BookAuthors.Any(ba => ba.Author != null && 
                                             (ba.Author.FullName.ToLower().StartsWith(lowerSearch) || 
                                              ba.Author.FullName.ToLower().Contains(" " + lowerSearch))));
            }

            // Lọc theo thể loại
            if (categoryId.HasValue && categoryId != Guid.Empty)
            {
                query = query.Where(b => b.CategoryId == categoryId.Value);
            }

            // Lọc theo tác giả
            if (authorId.HasValue && authorId != Guid.Empty)
            {
                query = query.Where(b => b.BookAuthors.Any(ba => ba.AuthorId == authorId.Value));
            }

            // Sắp xếp
            if (sortBy.ToLower() == "title")
            {
                query = sortDir.ToLower() == "asc" ? query.OrderBy(b => b.Title) : query.OrderByDescending(b => b.Title);
            }
            else if (sortBy.ToLower() == "publishedyear")
            {
                query = sortDir.ToLower() == "asc" ? query.OrderBy(b => b.PublishedYear) : query.OrderByDescending(b => b.PublishedYear);
            }
            else
            {
                query = sortDir.ToLower() == "asc" ? query.OrderBy(b => b.CreatedAt) : query.OrderByDescending(b => b.CreatedAt);
            }

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var books = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new BookDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    ISBN = b.ISBN,
                    Description = b.Description,
                    PublishedYear = b.PublishedYear,
                    Publisher = b.Publisher,
                    CoverImageUrl = b.CoverImageUrl,
                    TotalCopies = b.TotalCopies,
                    AvailableCopies = b.AvailableCopies,
                    CategoryId = b.CategoryId,
                    CategoryName = b.Category != null ? b.Category.Name : "Tự do",
                    Rating = b.Rating,
                    CreatedAt = b.CreatedAt,
                    Authors = b.BookAuthors.Select(ba => ba.AuthorId).ToList(),
                    AuthorsDetail = b.BookAuthors.Select(ba => new AuthorDto
                    {
                        Id = ba.AuthorId,
                        FullName = ba.Author != null ? ba.Author.FullName : string.Empty,
                        Biography = ba.Author != null ? ba.Author.Biography : string.Empty
                    }).ToList(),
                    CategoryDetail = b.Category != null ? new CategoryDto
                    {
                        Id = b.Category.Id,
                        Name = b.Category.Name,
                        Description = b.Category.Description
                    } : null
                })
                .ToListAsync();

            var response = ApiResponse<List<BookDto>>.Ok(books, "Lấy danh sách sách thành công.");
            response.Pagination = new PaginationInfo
            {
                CurrentPage = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages
            };

            return Ok(response);
        }

        // GET: api/books/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBook(Guid id)
        {
            var book = await _context.Books
                .Include(b => b.Category)
                .Include(b => b.BookAuthors)
                    .ThenInclude(ba => ba.Author)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (book == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy sách."));
            }

            var dto = new BookDto
            {
                Id = book.Id,
                Title = book.Title,
                ISBN = book.ISBN,
                Description = book.Description,
                PublishedYear = book.PublishedYear,
                Publisher = book.Publisher,
                CoverImageUrl = book.CoverImageUrl,
                TotalCopies = book.TotalCopies,
                AvailableCopies = book.AvailableCopies,
                CategoryId = book.CategoryId,
                CategoryName = book.Category != null ? book.Category.Name : "Tự do",
                Rating = book.Rating,
                CreatedAt = book.CreatedAt,
                Authors = book.BookAuthors.Select(ba => ba.AuthorId).ToList(),
                AuthorsDetail = book.BookAuthors.Select(ba => new AuthorDto
                {
                    Id = ba.AuthorId,
                    FullName = ba.Author != null ? ba.Author.FullName : string.Empty,
                    Biography = ba.Author != null ? ba.Author.Biography : string.Empty
                }).ToList(),
                CategoryDetail = book.Category != null ? new CategoryDto
                {
                    Id = book.Category.Id,
                    Name = book.Category.Name,
                    Description = book.Category.Description
                } : null
            };

            return Ok(ApiResponse<BookDto>.Ok(dto, "Chi tiết sách."));
        }

        // POST: api/books
        [HttpPost]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> CreateBook([FromBody] CreateBookDto dto)
        {
            if (await _context.Books.AnyAsync(b => b.ISBN == dto.ISBN))
            {
                return BadRequest(ApiResponse<object>.Fail("Mã ISBN đã tồn tại trên hệ thống."));
            }

            if (!await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId))
            {
                return BadRequest(ApiResponse<object>.Fail("Thể loại không tồn tại."));
            }

            foreach (var authorId in dto.Authors)
            {
                if (!await _context.Authors.AnyAsync(a => a.Id == authorId))
                {
                    return BadRequest(ApiResponse<object>.Fail($"Tác giả ID {authorId} không tồn tại."));
                }
            }

            var book = new Book
            {
                Title = dto.Title,
                ISBN = dto.ISBN,
                Description = dto.Description,
                PublishedYear = dto.PublishedYear,
                Publisher = dto.Publisher,
                CoverImageUrl = string.IsNullOrEmpty(dto.CoverImageUrl) 
                    ? "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600" 
                    : dto.CoverImageUrl,
                TotalCopies = dto.TotalCopies,
                AvailableCopies = dto.TotalCopies,
                CategoryId = dto.CategoryId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Books.Add(book);
            await _context.SaveChangesAsync();

            // Link authors
            foreach (var authorId in dto.Authors)
            {
                _context.BookAuthors.Add(new BookAuthor { BookId = book.Id, AuthorId = authorId });
            }
            await _context.SaveChangesAsync();

            // Get complete seeded object
            return await GetBook(book.Id);
        }

        // PUT: api/books/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> UpdateBook(Guid id, [FromBody] UpdateBookDto dto)
        {
            var book = await _context.Books
                .Include(b => b.BookAuthors)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (book == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy sách."));
            }

            if (await _context.Books.AnyAsync(b => b.ISBN == dto.ISBN && b.Id != id))
            {
                return BadRequest(ApiResponse<object>.Fail("Mã ISBN đã thuộc về một cuốn sách khác."));
            }

            if (!await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId))
            {
                return BadRequest(ApiResponse<object>.Fail("Thể loại không tồn tại."));
            }

            // Adjust availability copies
            int copyDifference = dto.TotalCopies - book.TotalCopies;
            int newAvailable = book.AvailableCopies + copyDifference;

            if (newAvailable < 0)
            {
                return BadRequest(ApiResponse<object>.Fail("Không thể giảm tổng số lượng sách thấp hơn số sách đang được mượn."));
            }

            book.Title = dto.Title;
            book.ISBN = dto.ISBN;
            book.Description = dto.Description;
            book.PublishedYear = dto.PublishedYear;
            book.Publisher = dto.Publisher;
            if (!string.IsNullOrEmpty(dto.CoverImageUrl))
            {
                book.CoverImageUrl = dto.CoverImageUrl;
            }
            book.TotalCopies = dto.TotalCopies;
            book.AvailableCopies = newAvailable;
            book.CategoryId = dto.CategoryId;
            book.UpdatedAt = DateTime.UtcNow;

            // Update Authors relation
            var existingAuthors = book.BookAuthors.Select(ba => ba.AuthorId).ToList();
            var toRemove = book.BookAuthors.Where(ba => !dto.Authors.Contains(ba.AuthorId)).ToList();
            var toAdd = dto.Authors.Where(aId => !existingAuthors.Contains(aId))
                                   .Select(aId => new BookAuthor { BookId = id, AuthorId = aId }).ToList();

            _context.BookAuthors.RemoveRange(toRemove);
            _context.BookAuthors.AddRange(toAdd);

            await _context.SaveChangesAsync();

            return await GetBook(book.Id);
        }

        // DELETE: api/books/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> DeleteBook(Guid id)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null)
            {
                return NotFound(ApiResponse<object>.Fail("Không tìm thấy sách."));
            }

            var hasActiveBorrows = await _context.BorrowRecords.AnyAsync(br => br.BookId == id && (br.Status == BorrowRecordStatus.Borrowed || br.Status == BorrowRecordStatus.Overdue));
            if (hasActiveBorrows)
            {
                return BadRequest(ApiResponse<object>.Fail("Không thể xóa sách đang được người mượn giữ."));
            }

            book.IsDeleted = true;
            await _context.SaveChangesAsync();
 
            return Ok(ApiResponse<object>.Ok(null!, "Xóa sách thành công."));
        }
    }
}
