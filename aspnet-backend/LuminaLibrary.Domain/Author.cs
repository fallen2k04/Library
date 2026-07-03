using System;
using System.ComponentModel.DataAnnotations;

namespace LuminaLibrary.Domain
{
    public class Author
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Biography { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [MaxLength(100)]
        public string? Nationality { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
