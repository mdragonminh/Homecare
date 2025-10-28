using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace HSP.Core.Dtos.ChatbotDto
{
    public class ChatInputDto
    {
        [Required]
        [StringLength(2000)]
        public string Message { get; set; }
        public Guid? ConversationId { get; set; }
    }

    public class ChatResponseDto
    {
        public string Response { get; set; }
        public Guid ConversationId { get; set; }
    }

    public class GptBookingArgs
    {
        [JsonPropertyName("Address")]
        public string Address { get; set; }

        [JsonPropertyName("DesireDateTime")]
        public DateTime DesireDateTime { get; set; }

        [JsonPropertyName("ServiceIds")]
        public List<string> ServiceIds { get; set; }
    }

    // JSON Schema
    public class BookingToolParameters
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "object";

        [JsonPropertyName("properties")]
        public BookingToolProperties Properties { get; set; }

        [JsonPropertyName("required")]
        public List<string> Required { get; set; } = ["Address", "DesireDateTime", "ServiceIds"];
    }

    public class BookingToolProperties
    {
        [JsonPropertyName("Address")]
        public ToolProperty Address { get; set; } = new("string", "Địa chỉ đầy đủ của khách hàng, ví dụ: '123 đường ABC, phường XYZ, quận 1, TPHCM'");

        [JsonPropertyName("DesireDateTime")]
        public ToolProperty DesireDateTime { get; set; } = new("string", "Ngày giờ mong muốn thực hiện dịch vụ, định dạng ISO 8601, ví dụ: '2025-10-30T14:30:00'") { Format = "date-time" };

        [JsonPropertyName("ServiceIds")]
        public ToolProperty ServiceIds { get; set; }
    }

    public class ToolProperty
    {
        [JsonPropertyName("type")]
        public string Type { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("format")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Format { get; set; }

        [JsonPropertyName("items")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public ToolPropertyItems? Items { get; set; }

        public ToolProperty(string type, string description)
        {
            Type = type;
            Description = description;
        }
    }

    public class ToolPropertyItems
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "string";

        [JsonPropertyName("description")]
        public string Description { get; set; } = "ID (Guid) của một dịch vụ";

        [JsonPropertyName("enum")]
        public List<string> Enum { get; set; }
    }
}
