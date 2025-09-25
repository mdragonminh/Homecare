namespace HSP.Service.Interfaces
{
	public interface ICustomerProfileService
	{
		Task<Guid> CreateCustomerProfileAsync(Guid userId);
	}
}
