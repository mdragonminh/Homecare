namespace HSP.Core.Dtos.EquipmentDto
{
    public class SubmitEquipmentDto
    {
        public Guid BookingId { get; set; }
        public List<Guid> BookingEquipmentIds { get; set; } = new();
    }

    public class ApproveEquipmentDto
    {
        public Guid BookingId { get; set; }
        public List<Guid> BookingEquipmentIds { get; set; } = new();
    }
}
