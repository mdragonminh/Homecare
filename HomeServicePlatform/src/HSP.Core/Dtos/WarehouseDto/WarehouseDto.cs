using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.WarehouseDto
{
    public class WarehouseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public Guid? ManagerId { get; set; }
        public string? ManagerName { get; set; }
        public int TotalEquipments { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
    }

    public class CreateWarehouseDto
    {
        [Required(ErrorMessage = "Warehouse name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [StringLength(255, ErrorMessage = "Address cannot exceed 255 characters")]
        public string? Address { get; set; }

        public Guid? ManagerId { get; set; }
    }

    public class UpdateWarehouseDto
    {
        [Required(ErrorMessage = "Warehouse name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [StringLength(255, ErrorMessage = "Address cannot exceed 255 characters")]
        public string? Address { get; set; }

        public Guid? ManagerId { get; set; }
    }

    public class WarehouseListDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? ManagerName { get; set; }
        public int TotalEquipments { get; set; }
        public DateTime DateCreated { get; set; }
    }

    public class WarehouseDetailDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public Guid? ManagerId { get; set; }
        public string? ManagerName { get; set; }
        public string? ManagerEmail { get; set; }
        public List<EquipmentInWarehouseDto> Equipments { get; set; } = new List<EquipmentInWarehouseDto>();
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
        public Guid? CreatedBy { get; set; }
        public Guid? ModifiedBy { get; set; }
    }

    public class EquipmentInWarehouseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? EquipmentCode { get; set; }
        public int Quantity { get; set; }
        public string? Description { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
    }
}
