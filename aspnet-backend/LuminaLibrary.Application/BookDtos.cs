using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace LuminaLibrary.Application
{
    public class BookDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ISBN { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? PublishedYear { get; set; }
        public string? Publisher { get; set; }
        public string? CoverImageUrl { get; set; }
        public int TotalCopies { get; set; }
        public int AvailableCopies { get; set; }
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public double Rating { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Detailed nested lists
        public List<Guid> Authors { get; set; } = new();
        public List<AuthorDto> AuthorsDetail { get; set; } = new();
        public CategoryDto? CategoryDetail { get; set; }
    }

    public class CreateBookDto
    {
        [Required(ErrorMessage = "Tiêu đề sách không được để trống")]
        [MaxLength(255, ErrorMessage = "Tiêu đề không quá 255 ký tự")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "ISBN không được để trống")]
        [MaxLength(50)]
        public string ISBN { get; set; } = string.Empty;

        [Required(ErrorMessage = "Ít nhất một tác giả là bắt buộc")]
        public List<Guid> Authors { get; set; } = new();

        [Required(ErrorMessage = "Thể loại không được để trống")]
        public Guid CategoryId { get; set; }

        [Range(1, 1000, ErrorMessage = "Số lượng sách phải lớn hơn 0")]
        public int TotalCopies { get; set; }

        public int? PublishedYear { get; set; }
        public string? Publisher { get; set; }
        public string? Description { get; set; }
        public string? CoverImageUrl { get; set; }
    }

    public class UpdateBookDto : CreateBookDto
    {
    }

    public class AuthorDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Biography { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Nationality { get; set; }
    }

    public class CreateAuthorDto
    {
        [Required(ErrorMessage = "Họ tên tác giả không được để trống")]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        public string? Biography { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Nationality { get; set; }
    }

    public class CategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class CreateCategoryDto
    {
        [Required(ErrorMessage = "Tên thể loại không được để trống")]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
    }
}
