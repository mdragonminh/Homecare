namespace HSP.Core.Interfaces.Entity
{
	public interface IDateTracking
	{
		DateTime DateCreated { set; get; }

		DateTime DateModified { set; get; }
	}
}
