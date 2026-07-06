using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LuminaLibrary.Domain
{
    public class Book
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string ISBN { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        public int? PublishedYear { get; set; }

        [MaxLength(150)]
        public string? Publisher { get; set; }

        [MaxLength(500)]
        public string? CoverImageUrl { get; set; }

        [Required]
        public int TotalCopies { get; set; }

        [Required]
        public int AvailableCopies { get; set; }

        [Required]
        public Guid CategoryId { get; set; }

        [ForeignKey("CategoryId")]
        public Category? Category { get; set; }

        public double Rating { get; set; } = 4.5;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [Timestamp]
        public byte[]? RowVersion { get; set; }

        public bool IsDeleted { get; set; } = false;

        // Many-to-Many Navigation
        public List<BookAuthor> BookAuthors { get; set; } = new();
    }
}
