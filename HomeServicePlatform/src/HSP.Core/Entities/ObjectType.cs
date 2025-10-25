using HSP.Core.Abstractions.Entity;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Entities
{
	public class ObjectType : BaseEntity<Guid>
	{
		[Required, MaxLength(100)]
		public string Name { get; set; }

		[MaxLength(255)]
		public string? Description { get; set; }

		public ICollection<FileRelation> FileRelations { get; set; } = new List<FileRelation>();
	}
}
