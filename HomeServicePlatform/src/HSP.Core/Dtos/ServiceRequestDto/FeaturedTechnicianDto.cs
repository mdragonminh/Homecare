namespace HSP.Core.Dtos.ServiceRequestDto
{
    public class FeaturedTechnicianDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public double Rating { get; set; }
        public int RatingCount { get; set; }
        public List<string> Services { get; set; } = new List<string>();
    }
}

