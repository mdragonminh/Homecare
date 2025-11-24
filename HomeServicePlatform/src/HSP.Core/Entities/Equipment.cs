using HSP.Core.Abstractions.Entity;
using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
    public class Equipment : BaseEntity<Guid>, IDateTracking, IHasSoftedDelete, IUserTracking
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = null!;

        [Required, MaxLength(100)]
        public string? EquipmentCode { get; set; }

        public int Quantity { get; set; } = 0;

        [Required]
        public Guid WarehouseId { get; set; }

        [ForeignKey("WarehouseId")]
        public Warehouse Warehouse { get; set; } = null!;

        [MaxLength(255)]
        public string? Description { get; set; }

        [MaxLength(100)]
        public string? Brand { get; set; }

        [MaxLength(100)]
        public string? ModelNumber { get; set; }

        [Required, MaxLength(50)]
        public string UnitOfMeasure { get; set; } = "Cái";

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; } = 0;

        [Column(TypeName = "decimal(18,2)")]
        public decimal CostPrice { get; set; } = 0;

        public int WarrantyDurationMonths { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime DateCreated { get; set; }

        public DateTime DateModified { get; set; }

        public bool IsDeleted { get; set; }

        public Guid? CreatedBy { get; set; }

        public Guid? ModifiedBy { get; set; }
    }
}