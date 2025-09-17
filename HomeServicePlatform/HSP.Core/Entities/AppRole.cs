using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	[Table("AppRoles")]
	public class AppRole : IdentityRole<Guid>
	{

	}
}
