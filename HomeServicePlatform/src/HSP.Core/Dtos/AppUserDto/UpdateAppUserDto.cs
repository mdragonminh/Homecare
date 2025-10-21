using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.AppUserDto
{
    public class UpdateAppUserDto
    {
        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Phone]
        [StringLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;
    }
}
