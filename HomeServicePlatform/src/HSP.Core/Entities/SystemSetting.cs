using HSP.Core.Abstractions.Entity;
using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Entities
{
	public class SystemSetting : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete, IUserTracking
	{
		[Required, MaxLength(100)]
		public string Key { get; set; } = null!;

		[Required, MaxLength(500)]
		public string Value { get; set; } = null!;

		[MaxLength(1000)]
		public string? Description { get; set; }

		[MaxLength(50)]
		public string? Group { get; set; }
		
		public bool IsSensitive { get; set; } = false;
		
		public DateTime DateCreated { get; set; }
		public DateTime DateModified { get; set; }
		public bool IsDeleted { get; set; }
		public Guid? CreatedBy { get; set; }
		public Guid? ModifiedBy { get; set; }
	}
}
