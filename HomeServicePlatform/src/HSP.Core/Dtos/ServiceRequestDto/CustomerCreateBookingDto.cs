using System.ComponentModel.DataAnnotations;
using HSP.Core.Resources;

namespace HSP.Core.Dtos.ServiceRequestDto
{
	public class CustomerCreateBookingDto
	{
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "AddressIsRequired")]
		public string Address { get; set; }
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "ServiceIdsIsRequired")]
		public List<Guid> ServiceIds { get; set; }
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "CustomerIdIsRequired")]
		public string CustomerId { get; set; }
		public double DistanceKm { get; set; } = 50;
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "DesireDateTimeIsRequired")]
		public DateTime DesireDateTime { get; set; }
	}
	public class MatchedBookingResultDto
	{
		public bool IsMatched { get; set; }
		public TechnicianResultDto TechnicianInfo { get; set; }
		public string Message { get; set; }
	}
}
