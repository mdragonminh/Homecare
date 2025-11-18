using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
	[Table("Roles")]
	public class AppRole : IdentityRole<Guid>
	{

	}
}
