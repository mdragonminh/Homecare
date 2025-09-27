using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.HomeItemDto
{
	public class UpdateHomeItemDto
	{
		[Required(ErrorMessage = "Tên vật dụng không được để trống.")]
		[StringLength(100, ErrorMessage = "Tên vật dụng không được vượt quá 100 ký tự.")]
		public string Name { get; set; }
		[StringLength(100, ErrorMessage = "Thương hiệu không được vượt quá 100 ký tự.")]
		public string? Brand { get; set; }
		[Required(ErrorMessage = "Loại vật dụng không được để trống.")]
		[StringLength(50, ErrorMessage = "Loại vật dụng không được vượt quá 50 ký tự.")]
		public string Type { get; set; }
		[StringLength(100, ErrorMessage = "Số model không được vượt quá 100 ký tự.")]
		public string? ModelNumber { get; set; }
		[StringLength(100, ErrorMessage = "Số sê-ri không được vượt quá 100 ký tự.")]
		public string? SerialNumber { get; set; }
		[StringLength(1000, ErrorMessage = "Ghi chú không được vượt quá 1000 ký tự.")]
		public string? Notes { get; set; }
		[Required(ErrorMessage = "Vui lòng chọn nhà cho vật dụng.")]
		public Guid HomeId { get; set; }
	}
}
