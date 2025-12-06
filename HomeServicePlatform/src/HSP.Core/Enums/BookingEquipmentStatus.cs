namespace HSP.Core.Enums
{
    public enum BookingEquipmentStatus
    {
        Draft = 0,             // Technician added, not yet submitted
        Submitted = 1,         // Submitted to customer for payment
        Paid = 2,              // Customer paid, awaiting manager approval
        AwaitingDelivery = 3,  // Manager approved, awaiting technician receipt
        Delivered = 4          // Technician confirmed receipt
    }
}