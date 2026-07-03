using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LuminaLibrary.Domain
{
    public class ClassRegistration
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ClassScheduleId { get; set; }

        [ForeignKey("ClassScheduleId")]
        public ClassSchedule? ClassSchedule { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;
    }
}
