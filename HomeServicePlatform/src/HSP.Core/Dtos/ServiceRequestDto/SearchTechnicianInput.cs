namespace HSP.Core.Dtos.ServiceRequestDto
{
	public class SearchTechnicianInput
	{
		public string? Address { get; set; }

		public double MaxDistanceKm { get; set; } = 50;

		public List<Guid> ServiceIds { get; set; } = new List<Guid>();
		//public double MinRating { get; set; }
	}
}
