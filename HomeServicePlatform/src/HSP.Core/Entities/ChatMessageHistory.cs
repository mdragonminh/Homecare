using HSP.Core.Interfaces.Entity;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Entities
{
    public class ChatMessageHistory : BaseEntity<Guid>, IDateTracking
    {
        [Required]
        public Guid ConversationId { get; set; } 

        [Required]
        public Guid CustomerId { get; set; } 

        [Required]
        [StringLength(20)]
        public string Role { get; set; } //  "User", "Assistant", "Tool"

        public string? Content { get; set; }

        public string? ToolCallId { get; set; }
        public string? FunctionName { get; set; } 
        public string? FunctionArguments { get; set; } 

        public DateTime DateCreated { get; set; } = DateTime.UtcNow;
        public DateTime DateModified { get; set; } = DateTime.UtcNow;
    }
}