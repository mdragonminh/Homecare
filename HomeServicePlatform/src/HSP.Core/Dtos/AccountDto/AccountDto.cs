using HSP.Core.Resources;
using System.ComponentModel.DataAnnotations;

namespace HSP.Core.Dtos.AccountDto
{
	public class CreateAccountRequestDto
	{
		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "EmailIsRequired")]
		[EmailAddress(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "InvalidEmailFormat")]
		public string Email { get; set; } = string.Empty;

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "UserNameIsRequired")]
		[StringLength(100, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "UserNameMaxLength")]
		public string Username { get; set; } = string.Empty;

		[Required(ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordIsRequired")]
		[StringLength(100, MinimumLength = 8, ErrorMessageResourceType = typeof(SharedResource), ErrorMessageResourceName = "PasswordLengthError")]
		public string Password { get; set; } = string.Empty;

		[Required]
		public string Role { get; set; } = string.Empty; // operator, equipmentmanager, supporter

		public string? FullName { get; set; }
		public string? PhoneNumber { get; set; }
		public string? Department { get; set; }
	}

	public class UpdateAccountRequestDto
	{
		public string? FullName { get; set; }
		public string? PhoneNumber { get; set; }
		public string? Department { get; set; }
		public bool? IsActive { get; set; }
	}

	public class AccountResponseDto
	{
		public string Id { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public string Username { get; set; } = string.Empty;
		public string? FullName { get; set; }
		public string? PhoneNumber { get; set; }
		public string Role { get; set; } = string.Empty;
		public string? Department { get; set; }
		public bool IsActive { get; set; }
		public bool EmailConfirmed { get; set; }
		public DateTime CreatedAt { get; set; }
		public DateTime? LastLoginAt { get; set; }
		public string? CreatedBy { get; set; }
	}

	public class AccountFilterDto
	{
		public string? SearchTerm { get; set; }
		public string? Role { get; set; }
		public bool? IsActive { get; set; }
		public string? Department { get; set; }
		public int PageNumber { get; set; } = 1;
		public int PageSize { get; set; } = 10;
	}

	public class DisableAccountRequestDto
	{
		public string Reason { get; set; } = string.Empty;
	}
	public class UserDto
	{
		public Guid Id { get; set; } 
		public string Email { get; set; } = string.Empty;
		public string Username { get; set; } = string.Empty;
		public string? FullName { get; set; }
		public string? PhoneNumber { get; set; }
		public string Role { get; set; } = string.Empty;
		public string? Department { get; set; }
		public bool IsActive { get; set; }
		public bool EmailConfirmed { get; set; }
		public DateTime CreatedAt { get; set; }
		public DateTime? LastLoginAt { get; set; }
		public string? CreatedBy { get; set; }
	}
}
