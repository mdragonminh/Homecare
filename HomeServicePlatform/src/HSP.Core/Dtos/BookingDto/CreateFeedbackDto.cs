using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.BookingDto
{
    public class CreateFeedbackDto
    {
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }
    }
}