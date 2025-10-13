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
    }

    public class CreateEquipmentDto
    {
        [Required(ErrorMessage = "Equipment name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Equipment code cannot exceed 100 characters")]
        public string? EquipmentCode { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Quantity must be a positive number")]
        public int Quantity { get; set; } = 0;

        [Required(ErrorMessage = "Warehouse is required")]
        public Guid WarehouseId { get; set; }

        [StringLength(255, ErrorMessage = "Description cannot exceed 255 characters")]
        public string? Description { get; set; }
    }

    public class UpdateEquipmentDto
    {
        [Required(ErrorMessage = "Equipment name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Equipment code cannot exceed 100 characters")]
        public string? EquipmentCode { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Quantity must be a positive number")]
        public int Quantity { get; set; }

        [Required(ErrorMessage = "Warehouse is required")]
        public Guid WarehouseId { get; set; }

        [StringLength(255, ErrorMessage = "Description cannot exceed 255 characters")]
        public string? Description { get; set; }
    }

    public class EquipmentListDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? EquipmentCode { get; set; }
        public int Quantity { get; set; }
        public string WarehouseName { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; }
    }

    public class UpdateEquipmentQuantityDto
    {
        [Range(0, int.MaxValue, ErrorMessage = "Quantity must be a positive number")]
        public int Quantity { get; set; }
    }
}
