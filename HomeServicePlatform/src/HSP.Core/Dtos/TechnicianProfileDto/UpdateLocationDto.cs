using HSP.Core.Entities;

namespace HSP.Core.Dtos.TechnicianProfileDto
{
	public class UpdateLocationDto : BaseEntity<Guid>
	{
		public double Latitude { get; set; }	
		public double Longitude { get; set; }
	}
}
