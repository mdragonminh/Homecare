using HSP.Core.Dtos.ServiceDto;
using HSP.Core.Dtos.Shared;
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
		public HomeServiceService(IRepository<Core.Entities.Service, Guid> homeServiceRepository,
			IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_homeServiceRepository = homeServiceRepository;
		}

		public async Task<Guid> CreateHomeServiceAsync(Guid userId, CreateHomeServiceDto input)
		{
			if(input == null)
			{
				throw new ArgumentNullException(nameof(input));
			}
			var newService = new Core.Entities.Service
			{
				Name = input.Name,
				Price = input.Price,
				Description = input.Description,
				DateCreated = DateTime.UtcNow,
				CreatedBy = userId
			};
			await _homeServiceRepository.AddAsync(newService);
			await _unitOfWork.SaveChangesAsync();
			return newService.Id;
		}

		public async Task<PagedList<HomePagedServiceDto>> GetAllAsync(HomeServiceInput input)
		{
			var query = _homeServiceRepository.GetAll()
				.WhereIf(!string.IsNullOrEmpty(input.Search), x => x.Name.ToLower().Contains(input.Search.ToLower()));
			var homeServiceDto = query
				.Select(s => new HomePagedServiceDto
				{
					Id = s.Id,
					Name = s.Name,
					Price = s.Price,
					Description = s.Description
				});
			var pagedHomeService = await homeServiceDto.ToPagedListAsync(input);
			return pagedHomeService;
		}

		public async Task<bool> UpdateHomeServiceAsync(Guid userId, Guid id, UpdateHomeServiceDto input)
		{
			if(input == null)
			{
				throw new ArgumentNullException(_localizer["InputCannotBeNull"]);
			}
			var existingService = await _homeServiceRepository.GetAll()
				.FirstOrDefaultAsync(x=>x.Id.Equals(id));
			if(existingService == null)
			{
				throw new KeyNotFoundException("Service not found");
			}
			var flag = false;
			if(existingService.Name != input.Name)
			{
				existingService.Name = input.Name;
				flag = true;
			}
			if(existingService.Price != input.Price)
			{
				existingService.Price = input.Price;
				flag = true;
			}
			if(existingService.Description != input.Description)
			{
				existingService.Description = input.Description;
				flag = true;
			}
			if(flag == true)
			{
				existingService.DateModified = DateTime.UtcNow;
				existingService.ModifiedBy = userId;
				await _unitOfWork.SaveChangesAsync();
			}
			return true;
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
