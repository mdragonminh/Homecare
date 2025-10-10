using HSP.Core.Dtos.ServiceDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations
{
	public class HomeServiceService : BaseService, IHomeServiceService
	{
		private readonly IRepository<Core.Entities.Service, Guid> _homeServiceRepository;
		private readonly IRepository<ServiceCategory, Guid> _serviceCategoryRepository;
		public HomeServiceService(IRepository<Core.Entities.Service, Guid> homeServiceRepository,
			IRepository<ServiceCategory, Guid> serviceCategoryRepository,
			IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_homeServiceRepository = homeServiceRepository;
			_serviceCategoryRepository = serviceCategoryRepository;
		}

		public async Task<IEnumerable<HomeServiceDto>> GetAllServicesAsync(HomeServiceInput input)
		{
			var services = _homeServiceRepository.GetAll()
				.Include(x => x.Category)
				.WhereIf(!string.IsNullOrEmpty(input.Search), x => x.Name.ToLower().Contains(input.Search.ToLower()))
				.WhereIf(input.CategoryId != null, x => x.Category.Id == input.CategoryId);
			var result = await services
				.OrderBy(x => x.Name)
				.GroupBy(x => new { x.Category.Id, x.Category.Name })
				.Select(g => new ServiceGroupDto
				{
					Category = new ServiceCategoryDto
					{
						Id = g.Key.Id,
						Name = g.Key.Name
					},
					Services = g.Select(s => new HomeServiceDto
					{
						Id = s.Id,
						Name = s.Name,
						BasePrice = s.BasePrice
					}).ToList()
				}).ToListAsync();
			return result;
		}

		#region service category
		public async Task<IEnumerable<ServiceCategoryDto>> GetAllServicesCategoryAsync()
		{
			var categories = _serviceCategoryRepository.GetAll();
			var result = await categories.Select(x => new ServiceCategoryDto
			{
				Id = x.Id,
				Name = x.Name
			}).ToListAsync();
			return result;
		}
		#endregion
	}
}
