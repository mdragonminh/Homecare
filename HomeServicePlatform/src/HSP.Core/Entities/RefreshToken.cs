using HSP.Core.Abstractions.Entity;
using System.ComponentModel.DataAnnotations.Schema;

namespace HSP.Core.Entities
{
    public class RefreshToken : BaseEntity<Guid>
    {
        public Guid UserId { get; set; }
        public string Token { get; set; } = default!;
        public DateTime Expires { get; set; }
        public bool IsRevoked { get; set; }

        public bool IsExpired => DateTime.UtcNow >= Expires;
        public bool IsActive => !IsExpired && !IsRevoked;
        [ForeignKey(nameof(UserId))]
        public AppUser User { get; set; } = default!;
    }
}
