using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.CustomerProfileDto
{
	public class UpdateCustomerProfileDto
	{
		[Required]
		[StringLength(100, MinimumLength = 1)]
		public string FullName { get; set; } = string.Empty;

		[Required]
		[Phone]
		[StringLength(15, MinimumLength = 10)]
		public string PhoneNumber { get; set; } = string.Empty;
	}
}
