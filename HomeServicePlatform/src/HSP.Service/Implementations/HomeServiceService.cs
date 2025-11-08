using HSP.Core.Dtos.ServiceDto;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations
{
	public class HomeServiceService : BaseService, IHomeServiceService
	{
		private readonly IRepository<Core.Entities.Service, Guid> _homeServiceRepository;
		public HomeServiceService(IRepository<Core.Entities.Service, Guid> homeServiceRepository,
			IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_homeServiceRepository = homeServiceRepository;
		}

		//public async Task<Guid> CreateHomeServiceAsync(CreateHomeServiceDto input)
		//{
		//	if (input == null)
		//	{
		//		throw new ArgumentNullException("input is null");
		//	}
		//	var homeService = new Core.Entities.Service
		//	{
		//		Name = input.Name,
		//		Description = input.Description,
		//		CreatedBy = input.CreatedBy,
		//		DateCreated = DateTime.UtcNow
		//	};
		//	var resutl = await _homeServiceRepository.AddAsync(homeService);
		//	await _unitOfWork.SaveChangesAsync();
		//	return resutl.Id;
		//}

		#region Home Page
		public async Task<IEnumerable<HomePageServiceDto>> GetAllServiceHomePageAsync()
		{
			var services = await _homeServiceRepository.GetAll()
				.OrderBy(x => x.Name)
				.Select(s => new HomePageServiceDto
				{
					Id = s.Id,
					Name = s.Name,
				}).ToListAsync();
			return services;
		}
		#endregion
	}
}
