using System;
using System.ComponentModel.DataAnnotations;

namespace LuminaLibrary.Domain
{
    public class PasswordResetToken
    {
        [Key]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(6)]
        public string Code { get; set; } = string.Empty;

        [Required]
        public DateTime ExpiryDate { get; set; }
    }
}
