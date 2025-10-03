using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;
namespace HSP.Core.Entities
{
	public class FileRelation : BaseEntity<Guid>, IDateTracking
	{
		[Required]
		public Guid FileId { get; set; }

		[Required]
		public Guid ObjectTypeId { get; set; }

		[Required]
		public Guid ObjectId { get; set; } 

		[MaxLength(100)]
		public string? RelationType { get; set; }

		public File File { get; set; }
		public ObjectType ObjectType { get; set; }
		public DateTime DateCreated { get ; set ; } = DateTime.UtcNow;
		public DateTime DateModified { get ; set ; }
	}
}
