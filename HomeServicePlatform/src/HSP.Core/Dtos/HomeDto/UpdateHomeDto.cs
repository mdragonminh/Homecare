using HSP.Core.Entities;
using System.ComponentModel.DataAnnotations;
using HSP.Core.Resources;

namespace HSP.Core.Dtos.HomeDto
{
	public class UpdateHomeDto 
	{
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "Home_Name_Required")]
		[StringLength(100, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "Home_Name_MaxLength")]
		public string Name { get; set; } = string.Empty;

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "Home_Address_Required")]
		[StringLength(200, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "Home_Address_MaxLength")]
		public string Address { get; set; } = string.Empty;
	}
}
