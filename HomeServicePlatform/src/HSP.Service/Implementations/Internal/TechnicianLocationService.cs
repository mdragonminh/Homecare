using HSP.Core.Dtos.TechnicianProfileDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations.Internal
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
			var technician = await _technicianProfileRepository.GetAll()
				.FirstOrDefaultAsync(x => x.UserId == CurrentTechId && x.ApprovalStatus == TechnicianApprovalStatus.Approved);
			if (technician == null)
			{
				throw new ArgumentException(_localizer["TechnicianNotFound"]);
			}
			double diffLat = Math.Abs(technician.Latitude - input.Latitude);
			double diffLng = Math.Abs(technician.Longitude - input.Longitude);
			if (diffLat < 0.0005 && diffLng < 0.0005)
			{
				return; 
			}
			var flag = false;
			if(technician.Latitude != input.Latitude)
			{
				technician.Latitude = input.Latitude;
				flag = true;
			}
			if(technician.Longitude != input.Longitude)
			{
				technician.Longitude = input.Longitude;
				flag = true;
			}
			if(flag == true)
			{
				technician.DateModified = DateTime.UtcNow;
				await _unitOfWork.SaveChangesAsync();
			}
		}
	}
}
