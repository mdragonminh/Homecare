using HSP.Core.Enums;

namespace HSP.Core.Dtos.EquipmentRequest
{
    public class EquipmentRequestDto
    {
        public Guid Id { get; set; }
        public Guid BookingId { get; set; }
        public string BookingCode { get; set; } = string.Empty;
        public Guid EquipmentId { get; set; }
        public string EquipmentName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public BookingEquipmentStatus Status { get; set; }
        public Guid? PaymentId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerPhone { get; set; }
        public string TechnicianName { get; set; } = string.Empty;
        public string? TechnicianPhone { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
    }

    public class EquipmentRequestDetailDto : EquipmentRequestDto
    {
        public BookingDetailInfo? BookingDetail { get; set; }
        public PaymentDetailInfo? PaymentDetail { get; set; }
    }

    public class BookingDetailInfo
    {
        public Guid Id { get; set; }
        public DateTime? DesiredDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public DateTime DateCreated { get; set; }
        public DateTime DateModified { get; set; }
        public CustomerInfo? Customer { get; set; }
        public TechnicianInfo? Technician { get; set; }
        public List<ServiceInfo> Services { get; set; } = new();
        public List<EquipmentInfo> AllEquipments { get; set; } = new();
    }

    public class CustomerInfo
    {
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
    }

    public class TechnicianInfo
    {
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
    }

    public class ServiceInfo
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }

    public class EquipmentInfo
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Total { get; set; }
        public BookingEquipmentStatus Status { get; set; }
    }

    public class PaymentDetailInfo
    {
        public Guid Id { get; set; }
        public decimal Amount { get; set; }
        public decimal ShippingFee { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? PaidAt { get; set; }
        public string? TransactionId { get; set; }
        public string? Description { get; set; }
    }

    public class ApproveEquipmentRequestDto
    {
        public Guid BookingId { get; set; }
        public List<Guid> BookingEquipmentIds { get; set; } = new();
    }

    public class ConfirmReceiptDto
    {
        public Guid BookingId { get; set; }
        public List<Guid> BookingEquipmentIds { get; set; } = new();
    }

    public class EquipmentRequestFilterDto
    {
        public BookingEquipmentStatus? Status { get; set; }
        public Guid? BookingId { get; set; }
        public Guid? TechnicianId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
