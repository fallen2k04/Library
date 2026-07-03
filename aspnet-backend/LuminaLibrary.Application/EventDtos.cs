using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace LuminaLibrary.Application
{
    public class CreateEventDto
    {
        [Required(ErrorMessage = "Tiêu đề không được trống")]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Thẻ không được trống")]
        [MaxLength(50)]
        public string Tag { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mô tả không được trống")]
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public string? LongDescription { get; set; }

        [Required(ErrorMessage = "Thời gian tổ chức không được trống")]
        public DateTime Date { get; set; }

        [Required(ErrorMessage = "Địa điểm không được trống")]
        [MaxLength(200)]
        public string Location { get; set; } = string.Empty;

        public int MaxCapacity { get; set; } = 100;

        public string? ImageUrl { get; set; }
        public string? Fee { get; set; } = "Free";
        public string? Host { get; set; }
        public DateTime? Deadline { get; set; }
    }

    public class EventDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Tag { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? LongDescription { get; set; }
        public DateTime Date { get; set; }
        public string Location { get; set; } = string.Empty;
        public int RegisteredCount { get; set; }
        public int MaxCapacity { get; set; }
        public string? ImageUrl { get; set; }
        public string? Fee { get; set; }
        public string? Host { get; set; }
        public DateTime? Deadline { get; set; }
        public double Rating { get; set; }
        public bool IsRegistered { get; set; } // Custom calculated for current logged-in user

        public List<SpeakerDto> Speakers { get; set; } = new();
        public List<ScheduleDto> Schedule { get; set; } = new();
        public List<ReviewDto> Reviews { get; set; } = new();
    }

    public class SpeakerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class ScheduleDto
    {
        public Guid Id { get; set; }
        public string Time { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class ReviewDto
    {
        public Guid Id { get; set; }
        public string User { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string Text { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public int Likes { get; set; }
    }

    public class CreateReviewDto
    {
        [Required(ErrorMessage = "Nội dung nhận xét không được trống")]
        [MaxLength(1000)]
        public string Text { get; set; } = string.Empty;
    }
}
