using System;
using System.ComponentModel.DataAnnotations;

namespace LuminaLibrary.Application
{
    public class BorrowRequestDto
    {
        [Required(ErrorMessage = "Vui lòng chọn sách cần mượn")]
        public Guid BookId { get; set; }

        public Guid? UserId { get; set; } // Mượn hộ (dành cho Admin/Librarian)

        public DateTime? DueDate { get; set; } // Ngày trả sách mong muốn
    }

    public class BorrowRecordDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid BookId { get; set; }
        public Guid? ApprovedByUserId { get; set; }
        public Guid? ReturnedToUserId { get; set; }
        public DateTime BorrowDate { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? ReturnDate { get; set; }
        public string Status { get; set; } = string.Empty; // Pending, Borrowed, Returned, Overdue, Rejected
        public decimal FineAmount { get; set; }
        public bool IsFinePaid { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }

        // Populated details
        public BookDto? BookDetail { get; set; }
        public UserDto? UserDetail { get; set; }
    }

    public class ReservationRequestDto
    {
        [Required(ErrorMessage = "Vui lòng chọn sách đặt trước")]
        public Guid BookId { get; set; }

        public Guid? UserId { get; set; } // Đặt hộ
    }

    public class ReservationDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid BookId { get; set; }
        public DateTime ReservationDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public string Status { get; set; } = string.Empty; // Waiting, Available, Fulfilled, Cancelled, Expired
        public int QueuePosition { get; set; }

        public BookDto? BookDetail { get; set; }
        public UserDto? UserDetail { get; set; }
    }

    public class MembershipRequestDto
    {
        [Required(ErrorMessage = "Tên gói không được để trống")]
        public string TierName { get; set; } = string.Empty;

        [Range(0, 10000000, ErrorMessage = "Giá gói phải lớn hơn hoặc bằng 0")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Phương thức thanh toán không được để trống")]
        public string PaymentMethod { get; set; } = string.Empty;
    }

    public class MembershipRequestDetailDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string TierName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Pending, Approved, Rejected
        public DateTime CreatedAt { get; set; }

        public UserDto? UserDetail { get; set; }
    }

    public class UpdateMembershipRequestStatusDto
    {
        [Required(ErrorMessage = "Trạng thái không được để trống")]
        public string Status { get; set; } = string.Empty; // Approved, Rejected
    }
}
