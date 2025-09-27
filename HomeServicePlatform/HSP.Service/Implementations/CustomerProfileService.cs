using HSP.Core.Dtos.CustomerProfileDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HSP.Service.Implementations
{
	public class CustomerProfileService : BaseService, ICustomerProfileService
	{
		private readonly IRepository<CustomerProfile, Guid> _customerProfileRepository;
		public CustomerProfileService(IRepository<CustomerProfile, Guid> customerProfileRepository, IUnitOfWork unitOfWork) : base(unitOfWork)
		{
			_customerProfileRepository = customerProfileRepository;
		}

		public async Task<Guid> CreateCustomerProfileAsync(Guid userId)
		{
			if(userId == null)
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
			var customerProfile = await _customerProfileRepository.GetAll()
				.Where(x => x.UserId.ToString().Equals(userId))
				.Select(x => new CustomerProfileDto
				{
					Id = x.Id,
					UserId = x.UserId,
				}).FirstOrDefaultAsync();
			if (customerProfile == null)
			{
				throw new KeyNotFoundException("Customer profile not found for the user.");
			}
			return customerProfile;
		}
	}
}
