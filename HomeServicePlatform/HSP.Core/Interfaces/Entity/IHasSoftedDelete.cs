namespace HSP.Core.Interfaces.Entity
{
	public interface IHasSoftedDelete
	{
		bool IsDeleted { set; get; }
	}
}
