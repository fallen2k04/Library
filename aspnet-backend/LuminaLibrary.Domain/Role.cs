using System;
using System.ComponentModel.DataAnnotations;

namespace LuminaLibrary.Domain
{
    public class Role
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty; // Admin, Librarian, Member
    }
}
