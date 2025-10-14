using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.CustomerProfileDto
{
    public class RequestEmailChangeDto
    {
        [Required]
        [EmailAddress]
        public string NewEmail { get; set; } = string.Empty;
    }

    public class ConfirmEmailChangeDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;
    }

    public class EmailChangeResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? NewEmail { get; set; }
    }
}
