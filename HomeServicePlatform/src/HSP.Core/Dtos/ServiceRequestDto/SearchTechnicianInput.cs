namespace HSP.Core.Dtos.ServiceRequestDto
{
	public class SearchTechnicianInput
	{
		public string? Address { get; set; }
		//public double? Lat { get; set; }
		//public double? Lng { get; set; }

		public double MaxDistanceKm { get; set; } = 50;

		//public decimal? MinPrice { get; set; } 
		//public decimal? MaxPrice { get; set; }
		//public List<Guid>? ServiceIds { get; set; }
		public double MinRating { get; set; }
	}
}
