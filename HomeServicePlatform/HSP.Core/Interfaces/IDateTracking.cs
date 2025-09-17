namespace HSP.Core.Interfaces
{
	public interface IDateTracking
	{
		DateTime DateCreated { set; get; }

		DateTime DateModified { set; get; }
	}
}
