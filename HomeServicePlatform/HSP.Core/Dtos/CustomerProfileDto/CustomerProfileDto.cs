namespace HSP.Core.Dtos.CustomerProfileDto
{
	public class CustomerProfileDto
	{
		public Guid Id { get; set; }
		public Guid UserId { get; set; }
		public string FullName { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public string PhoneNumber { get; set; } = string.Empty;
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
		public int TotalHomes { get; set; }
	}
}
