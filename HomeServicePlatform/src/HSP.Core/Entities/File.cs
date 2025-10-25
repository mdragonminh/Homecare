using HSP.Core.Abstractions.Entity;
using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Entities
{
	public class File : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete
	{
		[Required, MaxLength(255)]
		public string FileName { get; set; }

		[Required, MaxLength(500)]
		public string FilePath { get; set; }

		[Required, MaxLength(100)]
		public string FileType { get; set; }

		public long FileSize { get; set; }

		public Guid UploadedBy { get; set; }

		public DateTime DateCreated { get; set; } = DateTime.UtcNow;
		public DateTime DateModified { get; set; }
		public bool IsDeleted { get; set; }

		public ICollection<FileRelation> FileRelations { get; set; } = new List<FileRelation>();
		
	}
}
