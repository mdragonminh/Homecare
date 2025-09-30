using HSP.Core.Dtos.CustomerProfileDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations
{
	public class CustomerProfileService : BaseService, ICustomerProfileService
	{
		private readonly IRepository<CustomerProfile, Guid> _customerProfileRepository;
		public CustomerProfileService(IRepository<CustomerProfile, Guid> customerProfileRepository,
			IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_customerProfileRepository = customerProfileRepository;
		}

		public async Task<Guid> CreateCustomerProfileAsync(Guid userId)
		{
			if(userId == Guid.Empty)
			{
				throw new UnauthorizedAccessException("Người dùng chưa được xác thực.");
			}
			var customerProfile = new CustomerProfile
			{
				UserId = userId,
				DateCreated = DateTime.UtcNow
			};
			await _customerProfileRepository.AddAsync(customerProfile);
			await _unitOfWork.SaveChangesAsync();
			return customerProfile.Id;
		}

		public async Task<CustomerProfileDto> GetCustomerProfileByUserIdAsync(string userId)
		{
			// Debug: Log userId để kiểm tra
			Console.WriteLine($"[DEBUG] Searching for CustomerProfile with UserId: {userId}");
			
			var customerProfile = await _customerProfileRepository.GetAll()
				.Include(x => x.User)
				.Include(x => x.Homes)
				.Where(x => x.UserId.ToString().Equals(userId) && !x.IsDeleted)
				.Select(x => new CustomerProfileDto
				{
					Id = x.Id,
					UserId = x.UserId,
					FullName = x.User.FullName,
					Email = x.User.Email ?? string.Empty,
					PhoneNumber = x.User.PhoneNumber ?? string.Empty,
					DateCreated = x.DateCreated,
					DateModified = x.DateModified,
					TotalHomes = x.Homes.Count(h => !h.IsDeleted)
				}).FirstOrDefaultAsync();
				
			// Debug: Log kết quả
			Console.WriteLine($"[DEBUG] CustomerProfile found: {customerProfile != null}");
			
			if (customerProfile == null)
			{
				// Debug: Kiểm tra xem có profile nào trong database không
				var allProfiles = await _customerProfileRepository.GetAll()
					.Where(x => !x.IsDeleted)
					.Select(x => new { x.Id, x.UserId })
					.ToListAsync();
				Console.WriteLine($"[DEBUG] Total profiles in database: {allProfiles.Count}");
				foreach (var p in allProfiles)
				{
					Console.WriteLine($"[DEBUG] Profile ID: {p.Id}, UserId: {p.UserId}");
				}
				
				throw new KeyNotFoundException($"Customer profile not found for user ID: {userId}");
			}
			return customerProfile;
		}

		public async Task<CustomerProfileDto> GetCustomerProfileByIdAsync(Guid profileId)
		{
			var customerProfile = await _customerProfileRepository.GetAll()
				.Include(x => x.User)
				.Include(x => x.Homes)
				.Where(x => x.Id == profileId && !x.IsDeleted)
				.Select(x => new CustomerProfileDto
				{
					Id = x.Id,
					UserId = x.UserId,
					FullName = x.User.FullName,
					Email = x.User.Email ?? string.Empty,
					PhoneNumber = x.User.PhoneNumber ?? string.Empty,
					DateCreated = x.DateCreated,
					DateModified = x.DateModified,
					TotalHomes = x.Homes.Count(h => !h.IsDeleted)
				}).FirstOrDefaultAsync();
			if (customerProfile == null)
			{
				throw new KeyNotFoundException("Customer profile not found.");
			}
			return customerProfile;
		}

		public async Task<object> GetDebugInfoAsync()
		{
			try
			{
				var profiles = await _customerProfileRepository.GetAll()
					.Include(x => x.User)
					.Where(x => !x.IsDeleted)
					.Select(x => new {
						Id = x.Id,
						UserId = x.UserId,
						UserEmail = x.User != null ? x.User.Email : "N/A",
						UserName = x.User != null ? x.User.FullName : "N/A",
						DateCreated = x.DateCreated
					}).ToListAsync();

				return new {
					TotalProfiles = profiles.Count,
					Profiles = profiles
				};
			}
			catch (Exception ex)
			{
				return new {
					Error = ex.Message,
					TotalProfiles = 0,
					Profiles = new object[0]
				};
			}
		}
	}
}
