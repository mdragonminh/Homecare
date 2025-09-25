using HSP.Core.Dtos.CustomerProfileDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces;
using HSP.Service.Interfaces;

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
	}
}
