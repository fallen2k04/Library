using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LuminaLibrary.Domain
{
    public class LibraryEvent
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Tag { get; set; } = string.Empty; // Workshop, Exhibition, Seminar, Book Club

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Upcoming"; // Upcoming, Completed, Canceled

        [Required]
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public string? LongDescription { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        [MaxLength(200)]
        public string Location { get; set; } = string.Empty;

        public int RegisteredCount { get; set; } = 0;

        public int MaxCapacity { get; set; } = 100;

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public string? Fee { get; set; } = "Free";

        public string? Host { get; set; }

        public DateTime? Deadline { get; set; }

        public double Rating { get; set; } = 4.8;

        public List<EventSpeaker> Speakers { get; set; } = new();
        public List<EventSchedule> Schedule { get; set; } = new();
        public List<EventReview> Reviews { get; set; } = new();
    }

    public class EventSpeaker
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid EventId { get; set; }

        [ForeignKey("EventId")]
        public LibraryEvent? Event { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Title { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }
    }

    public class EventSchedule
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid EventId { get; set; }

        [ForeignKey("EventId")]
        public LibraryEvent? Event { get; set; }

        [Required]
        [MaxLength(50)]
        public string Time { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }
    }

    public class EventReview
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid EventId { get; set; }

        [ForeignKey("EventId")]
        public LibraryEvent? Event { get; set; }

        [Required]
        [MaxLength(100)]
        public string User { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Avatar { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Text { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Time { get; set; } = "Vừa xong";

        public int Likes { get; set; } = 0;
    }

    public class EventRegistration
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid EventId { get; set; }

        [ForeignKey("EventId")]
        public LibraryEvent? Event { get; set; }

        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;
    }
}
