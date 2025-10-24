namespace HSP.Core.Interfaces.Entity
{
	public interface IUserTracking
	{
		Guid? CreatedBy { set; get; }
		Guid? ModifiedBy { set; get; }
	}
}
