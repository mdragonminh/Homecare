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

		public async Task<Guid> CreateHomeService(CreateHomeServiceDto input)
		{
			if(input.Name == null)
			{
				throw new ArgumentNullException(nameof(input));
			}
			var newService = new Core.Entities.Service
			{
				Name = input.Name,
				Description = input.Description,
				DateCreated = input.DateCreated,
			};
			await _homeServiceRepository.AddAsync(newService);
			await _unitOfWork.SaveChangesAsync();
			return newService.Id;
		}
		#region Home Page
		public async Task<IEnumerable<HomeServiceDto>> GetAllServiceHomePageAsync()
		{
			var services = await _homeServiceRepository.GetAll()
				.OrderBy(x => x.Name)
				.Select(s => new HomeServiceDto
				{
					Id = s.Id,
					Name = s.Name,
				}).ToListAsync();
			return services;
		}
		#endregion
	}
}
