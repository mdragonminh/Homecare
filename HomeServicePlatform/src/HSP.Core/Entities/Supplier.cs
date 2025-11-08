using HSP.Core.Abstractions.Entity;
using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Entities
{
    public class Supplier : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete, IUserTracking
    {
        [Required, MaxLength(255)]
        public string Name { get; set; } = null!;

        public virtual ICollection<Equipment> Equipments { get; set; } = new List<Equipment>();

        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
        public bool IsDeleted { get; set; }
        public Guid? CreatedBy { get; set; }
        public Guid? ModifiedBy { get; set; }
    }
}
