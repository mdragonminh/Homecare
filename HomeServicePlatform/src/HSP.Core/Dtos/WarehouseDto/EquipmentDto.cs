using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.WarehouseDto
{
    public class EquipmentDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? EquipmentCode { get; set; }
        public int Quantity { get; set; }
        public Guid WarehouseId { get; set; }
        public string WarehouseName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
        public string? Brand { get; set; }
        public string? ModelNumber { get; set; }
        public string UnitOfMeasure { get; set; } = "Cái";
        public decimal UnitPrice { get; set; }
        public decimal CostPrice { get; set; }
        public int WarrantyDurationMonths { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateEquipmentDto
    {
        [Required(ErrorMessage = "Equipment name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Equipment code is required")]
        [StringLength(100, ErrorMessage = "Equipment code cannot exceed 100 characters")]
        public string? EquipmentCode { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Quantity must be a positive number")]
        public int Quantity { get; set; } = 0;

        [Required(ErrorMessage = "Warehouse is required")]
        public Guid WarehouseId { get; set; }

        [StringLength(255, ErrorMessage = "Description cannot exceed 255 characters")]
        public string? Description { get; set; }

        [StringLength(100)]
        public string? Brand { get; set; }

        [StringLength(100)]
        public string? ModelNumber { get; set; }

        [Required(ErrorMessage = "Unit of Measure is required")]
        [StringLength(50)]
        public string UnitOfMeasure { get; set; } = "Cái";

        [Range(0, double.MaxValue, ErrorMessage = "Unit price must be positive")]
        public decimal UnitPrice { get; set; } = 0;

        [Range(0, double.MaxValue, ErrorMessage = "Cost price must be positive")]
        public decimal CostPrice { get; set; } = 0;

        [Range(0, int.MaxValue, ErrorMessage = "Warranty must be positive")]
        public int WarrantyDurationMonths { get; set; } = 0;

        public bool IsActive { get; set; } = true;
    }

    public class UpdateEquipmentDto
    {
        [Required(ErrorMessage = "Equipment name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Equipment code is required")]
        [StringLength(100, ErrorMessage = "Equipment code cannot exceed 100 characters")]
        public string? EquipmentCode { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Quantity must be a positive number")]
        public int Quantity { get; set; }

        [Required(ErrorMessage = "Warehouse is required")]
        public Guid WarehouseId { get; set; }

        [StringLength(255, ErrorMessage = "Description cannot exceed 255 characters")]
        public string? Description { get; set; }

        [StringLength(100)]
        public string? Brand { get; set; }

        [StringLength(100)]
        public string? ModelNumber { get; set; }

        [Required(ErrorMessage = "Unit of Measure is required")]
        [StringLength(50)]
        public string UnitOfMeasure { get; set; } = "Cái";

        [Range(0, double.MaxValue, ErrorMessage = "Unit price must be positive")]
        public decimal UnitPrice { get; set; } = 0;

        [Range(0, double.MaxValue, ErrorMessage = "Cost price must be positive")]
        public decimal CostPrice { get; set; } = 0;

        [Range(0, int.MaxValue, ErrorMessage = "Warranty must be positive")]
        public int WarrantyDurationMonths { get; set; } = 0;

        public bool IsActive { get; set; } = true;
    }

    public class EquipmentListDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? EquipmentCode { get; set; }
        public int Quantity { get; set; }
        public string WarehouseName { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; }
        public string? Brand { get; set; }
        public string? ModelNumber { get; set; }
        public decimal UnitPrice { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateEquipmentQuantityDto
    {
        [Range(0, int.MaxValue, ErrorMessage = "Quantity must be a positive number")]
        public int Quantity { get; set; }
    }
}