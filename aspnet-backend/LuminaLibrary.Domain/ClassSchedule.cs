using System;
using System.ComponentModel.DataAnnotations;

namespace LuminaLibrary.Domain
{
    public class ClassSchedule
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Instructor { get; set; } = string.Empty;

        [Required]
        public DateTime Date { get; set; }

        [Required]
        [MaxLength(50)]
        public string Time { get; set; } = string.Empty;

        [Required]
        public int MaxCapacity { get; set; } = 30;

        [Required]
        public int RegisteredCount { get; set; } = 0;

        public string? Description { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
