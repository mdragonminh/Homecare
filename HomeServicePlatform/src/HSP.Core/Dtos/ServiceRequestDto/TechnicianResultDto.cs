using HSP.Core.Abstractions.Entity;

namespace HSP.Core.Dtos.ServiceRequestDto
{
	public class TechnicianResultDto : BaseEntity<Guid>
	{
		public string Name { get; set; }
		//public decimal MinPrice { get; set; }
		//public decimal MaxPrice { get; set; }
		public double DistanceKm { get; set; }
		public double Latitude { get; set; }
		public double Longitude { get; set; }
		public List<string>? Services { get; set; }
	}
}
