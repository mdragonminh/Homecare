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
		private readonly ISystemSettingService _systemSettingService;
		public HomeServiceService(IRepository<Core.Entities.Service, Guid> homeServiceRepository,
			ISystemSettingService systemSettingService,
			IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_homeServiceRepository = homeServiceRepository;
			_systemSettingService = systemSettingService;
		}

		public async Task<Guid> CreateHomeServiceAsync(Guid userId, CreateHomeServiceDto input)
		{
			if (input == null)
			{
				throw new ArgumentNullException(nameof(input));
			}
			
			var basePrice = await _systemSettingService.GetSettingValueAsDecimalAsync("DefaultServiceBasePrice", 100000);
			var servicePrice = input.Price ?? basePrice;
			
			if (servicePrice < basePrice)
			{
				throw new InvalidOperationException($"Service price ({servicePrice:N0} VND) cannot be less than the base price ({basePrice:N0} VND)");
			}
			
			var newService = new Core.Entities.Service
			{
				Name = input.Name,
				Price = servicePrice,
				Description = input.Description,
				DateCreated = DateTime.UtcNow,
				CreatedBy = userId
			};
			await _homeServiceRepository.AddAsync(newService);
			await _unitOfWork.SaveChangesAsync();
			return newService.Id;
		}

	public async Task<PagedList<AdminHomeServiceDto>> GetAllAsync(HomeServiceInput input)
	{
		var query = _homeServiceRepository.GetAll()
			.IgnoreQueryFilters()
			.WhereIf(!string.IsNullOrEmpty(input.Search), x => x.Name.ToLower().Contains(input.Search!.ToLower()))
			.WhereIf(input.IsDeleted.HasValue, x => x.IsDeleted == input.IsDeleted!.Value);
		var homeServiceDto = query
			.Select(s => new AdminHomeServiceDto
			{
				Id = s.Id,
				Name = s.Name,
				Price = s.Price,
				Description = s.Description,
				IsDeleted = s.IsDeleted
			});
		var pagedHomeService = await homeServiceDto.ToPagedListAsync(input);
		return pagedHomeService;
	}		public async Task<AdminHomeServiceDto> GetHomeServiceByIdAsync(Guid id)
		{
			var service = await _homeServiceRepository.GetByIdAsync(id);
			if (service == null)
			{
				throw new KeyNotFoundException("home service not found");
			}
			var serviceDto = new AdminHomeServiceDto
			{
				Id = service.Id,
				Name = service.Name,
				Description = service.Description,
				Price = service.Price
			};
			return serviceDto;
		}

		public async Task<bool> UpdateHomeServiceAsync(Guid userId, Guid id, UpdateHomeServiceDto input)
		{
			if (input == null)
			{
				throw new ArgumentNullException(_localizer["InputCannotBeNull"]);
			}
			var existingService = await _homeServiceRepository.GetAll().IgnoreQueryFilters()
				.FirstOrDefaultAsync(x => x.Id.Equals(id));
			if (existingService == null)
			{
				throw new KeyNotFoundException("Service not found");
			}
			
			var basePrice = await _systemSettingService.GetSettingValueAsDecimalAsync("DefaultServiceBasePrice", 100000);
			if (input.Price < basePrice)
			{
				throw new InvalidOperationException($"Service price ({input.Price:N0} VND) cannot be less than the base price ({basePrice:N0} VND)");
			}
			
			var flag = false;
			if (existingService.Name != input.Name)
			{
				existingService.Name = input.Name;
				flag = true;
			}
			if (existingService.Price != input.Price)
			{
				existingService.Price = input.Price;
				flag = true;
			}
			if (existingService.Description != input.Description)
			{
				existingService.Description = input.Description;
				flag = true;
			}
			if (input.IsDeleted.HasValue && existingService.IsDeleted != input.IsDeleted.Value)
			{
				existingService.IsDeleted = input.IsDeleted.Value;
				flag = true;
			}
			if (flag == true)
			{
				existingService.DateModified = DateTime.UtcNow;
				existingService.ModifiedBy = userId;
				await _unitOfWork.SaveChangesAsync();
			}
			return true;
		}
		public async Task<bool> DeleteHomeServiceAsync(Guid id)
		{
			var homeService = await _homeServiceRepository.GetAll()
				.Include(x => x.Technicians)
				.FirstOrDefaultAsync(hs => hs.Id.Equals(id));
			if (homeService == null)
			{
				throw new KeyNotFoundException("Service not found");
			}
			var isInUse = homeService.Technicians?.Where(x => x.ApprovalStatus == Core.Enums.TechnicianApprovalStatus.Approved).Any() ?? false;
			if (isInUse)
			{
				throw new InvalidOperationException(_localizer["ServiceIsCurrentlyInUse"]);
			}
			await _homeServiceRepository.DeleteAsync(id);
			await _unitOfWork.SaveChangesAsync();
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