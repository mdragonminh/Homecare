using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	[Table("AppUsers")]
	public class AppUser : IdentityUser<Guid>
	{
		[Required]
		[StringLength(100)]
		public string FullName { get; set; } = string.Empty;
		public CustomerProfile? CustomerProfile { get; set; }
		public TechnicianProfile? TechnicianProfile { get; set; }
	}
}
