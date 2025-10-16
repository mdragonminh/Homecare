using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.ServiceRequestDto
{
	public class CustomerCreateBookingDto
	{
		[Required]
		public string Address { get; set; }
		[Required]
		public List<Guid> ServiceIds { get; set; }
		[Required]
		public Guid CustomerId { get; set; }
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
