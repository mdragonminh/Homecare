using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.ServiceRequestDto
{
	public class CustomerCreateBookingDto
	{
		public string Address { get; set; }
		public List<Guid> ServiceIds { get; set; }
		public string CustomerId { get; set; }
		public double DistanceKm { get; set; } = 50;
	}
	public class MatchedBookingResultDto
	{
		public bool IsMatched { get; set; }
		public Guid? BookingId { get; set; }
		public TechnicianResultDto TechnicianInfo { get; set; }
		public string Message { get; set; }
	}
}
