using System.ComponentModel.DataAnnotations;
using HSP.Core.Resources;

namespace HSP.Core.Dtos.HomeItemDto
{
	public class CreateHomeItemDto
	{
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "HomeItem_Name_Required")]
		[StringLength(100, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "HomeItem_Name_MaxLength")]
		public string Name { get; set; }
		[StringLength(100, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "HomeItem_Brand_MaxLength")]
		public string? Brand { get; set; }
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "HomeItem_Type_Required")]
		[StringLength(50, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "HomeItem_Type_MaxLength")]
		public string Type { get; set; }
		[StringLength(100, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "HomeItem_ModelNumber_MaxLength")]
		public string? ModelNumber { get; set; }
		[StringLength(100, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "HomeItem_SerialNumber_MaxLength")]
		public string? SerialNumber { get; set; }
		[StringLength(1000, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "HomeItem_Notes_MaxLength")]
		public string? Notes { get; set; }
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "HomeItem_HomeId_Required")]
		public Guid HomeId { get; set; }
	}
}
