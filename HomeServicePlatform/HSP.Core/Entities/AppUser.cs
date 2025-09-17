using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	[Table("AppUsers")]
	public class AppUser : IdentityUser<Guid>
	{
	}
}
