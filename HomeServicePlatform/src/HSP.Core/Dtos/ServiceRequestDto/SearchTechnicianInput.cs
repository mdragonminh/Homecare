namespace HSP.Core.Dtos.ServiceRequestDto
{
	public class SearchTechnicianInput
	{
		public string? Address { get; set; }

		public List<Guid> ServiceIds { get; set; } = new List<Guid>();
		//public double MinRating { get; set; }
	}
}
