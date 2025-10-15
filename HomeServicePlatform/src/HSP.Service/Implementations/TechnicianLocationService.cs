using HSP.Core.Dtos.TechnicianProfileDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations
{
	public class TechnicianLocationService : BaseService, ITechnicianLocationService
	{
		private readonly IRepository<TechnicianProfile, Guid> _technicianProfileRepository;
		public TechnicianLocationService(IRepository<TechnicianProfile, Guid> technicianProfileRepository
			, IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_technicianProfileRepository = technicianProfileRepository;
		}
		public async Task UpdateLocationAsync(UpdateLocationDto input, Guid CurrentTechId)
		{
			if (input == null)
			{
				throw new ArgumentNullException("input parameter cannot be null");
			}
			if (input.Latitude < -90 || input.Latitude > 90 || input.Longitude < -180 || input.Longitude > 180)
			{
				throw new ArgumentException(_localizer["InvalidCoordinates"]);
			}
			var technician = await _technicianProfileRepository.GetAll()
				.FirstOrDefaultAsync(x => x.UserId == CurrentTechId);
			double diffLat = Math.Abs(technician.Latitude - input.Latitude);
			double diffLng = Math.Abs(technician.Longitude - input.Longitude);
			if (diffLat < 0.0005 && diffLng < 0.0005)
			{
				return; 
			}
			if (technician == null)
			{
				throw new ArgumentException(_localizer["TechnicianNotFound"]);
			}
			technician.Latitude = input.Latitude;
			technician.Longitude = input.Longitude;
			technician.DateModified = DateTime.UtcNow;
			await _unitOfWork.SaveChangesAsync();
		}
	}
}
