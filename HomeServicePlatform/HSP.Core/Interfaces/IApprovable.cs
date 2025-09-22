namespace HSP.Core.Interfaces
{
	public interface IApprovable
	{
		DateTime? ApprovedAt { get; set; }
		string? ApprovedBy { get; set; }
	}
}
