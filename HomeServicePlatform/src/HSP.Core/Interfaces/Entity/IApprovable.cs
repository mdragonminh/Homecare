namespace HSP.Core.Interfaces.Entity
{
	public interface IApprovable
	{
		DateTime? ApprovedAt { get; set; }
		string? ApprovedBy { get; set; }
	}
}
