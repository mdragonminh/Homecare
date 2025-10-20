using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.ServiceRequestDto
{
	public class CustomerCreateBookingDto
	{
		public string Address { get; set; }
		[Required]
		public List<Guid> ServiceIds { get; set; }
		[Required]
		public string CustomerId { get; set; }
		public double DistanceKm { get; set; } = 50;
		[Required]
		public DateTime DesireDateTime { get; set; }
	}
	public class MatchedBookingResultDto
	{
		public bool IsMatched { get; set; }
		public TechnicianResultDto TechnicianInfo { get; set; }
		public string Message { get; set; }
	}
}
