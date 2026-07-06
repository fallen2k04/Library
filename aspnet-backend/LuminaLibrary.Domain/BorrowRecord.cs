using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LuminaLibrary.Domain
{
    public class BorrowRecord
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        public Guid BookId { get; set; }

        [ForeignKey("BookId")]
        public Book? Book { get; set; }

        public Guid? ApprovedByUserId { get; set; }

        [ForeignKey("ApprovedByUserId")]
        public User? ApprovedByUser { get; set; }

        public Guid? ReturnedToUserId { get; set; }

        [ForeignKey("ReturnedToUserId")]
        public User? ReturnedToUser { get; set; }

        [Required]
        public DateTime BorrowDate { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime DueDate { get; set; }

        public DateTime? ReturnDate { get; set; }

        [Required]
        public BorrowRecordStatus Status { get; set; } = BorrowRecordStatus.Pending; // Pending, Borrowed, Returned, Overdue, Rejected

        [Column(TypeName = "decimal(10,2)")]
        public decimal FineAmount { get; set; } = 0;

        public bool IsFinePaid { get; set; } = false;

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
