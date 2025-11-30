using HSP.Core.Abstractions.DataAccess;
using HSP.Core.Constans;
using HSP.Core.Dtos.AccountDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;
using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Implementations.Internal
{
	public class AccountManagementService : BaseService, IAccountManagementService
	{
		private readonly IUserRepository _userRepository;
		private readonly IRoleRepository _roleRepository;

		public AccountManagementService(
				IUserRepository userRepository,
			 IRoleRepository roleRepository,
				IUnitOfWork unitOfWork,
				IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_userRepository = userRepository;
			_roleRepository = roleRepository;
		}

		public async Task<PagedList<AccountResponseDto>> GetAccountsAsync(AccountFilterDto filter)
		{
			// Get all users
			var allUsers = await _userRepository.GetAllUsersAsync();
			var accountDtos = new List<AccountResponseDto>();

			foreach (var user in allUsers)
			{
				var roles = await _userRepository.GetRolesAsync(user);
				var userRole = roles.FirstOrDefault();

				// Apply filters
				if (!string.IsNullOrEmpty(filter.SearchTerm))
				{
					var searchTerm = filter.SearchTerm.ToLower();
					if (!(user.Email?.ToLower().Contains(searchTerm) == true ||
								user.UserName?.ToLower().Contains(searchTerm) == true ||
								user.FullName?.ToLower().Contains(searchTerm) == true))
					{
						continue;
					}
				}

				if (filter.IsActive.HasValue && user.IsActive != filter.IsActive.Value)
				{
					continue;
				}

				if (!string.IsNullOrEmpty(filter.Department) && user.Department != filter.Department)
				{
					continue;
				}

				if (!string.IsNullOrEmpty(filter.Role) && userRole != filter.Role)
				{
					continue;
				}

				accountDtos.Add(new AccountResponseDto
				{
					Id = user.Id.ToString(),
					Email = user.Email ?? string.Empty,
					Username = user.UserName ?? string.Empty,
					FullName = user.FullName,
					PhoneNumber = user.PhoneNumber,
					Role = userRole ?? string.Empty,
					Department = user.Department,
					IsActive = user.IsActive,
					EmailConfirmed = user.EmailConfirmed,
					CreatedAt = user.DateCreated,
					LastLoginAt = user.LastLoginAt,
					CreatedBy = user.CreatedBy.ToString()
				});
			}

			// Apply pagination
			var totalCount = accountDtos.Count;
			var pagedItems = accountDtos
					.Skip((filter.PageNumber - 1) * filter.PageSize)
					.Take(filter.PageSize)
					.ToList();

			return new PagedList<AccountResponseDto>(pagedItems, totalCount, filter.PageNumber, filter.PageSize);
		}

		public async Task<AccountResponseDto?> GetAccountByIdAsync(string accountId)
		{
			if (!Guid.TryParse(accountId, out var userId))
			{
				return null;
			}
			var user = await _userRepository.FindByIdAsync(userId);
			if (user == null) return null;

			var roles = await _userRepository.GetRolesAsync(user);
			var userRole = roles.FirstOrDefault();

			return new AccountResponseDto
			{
				Id = user.Id.ToString(),
				Email = user.Email ?? string.Empty,
				Username = user.UserName ?? string.Empty,
				FullName = user.FullName,
				PhoneNumber = user.PhoneNumber,
				Role = userRole ?? string.Empty,
				Department = user.Department,
				IsActive = user.IsActive,
				EmailConfirmed = user.EmailConfirmed,
				CreatedAt = user.DateCreated,
				LastLoginAt = user.LastLoginAt,
				CreatedBy = user.CreatedBy.ToString()
			};
		}

		public async Task<string> CreateAccountAsync(CreateAccountRequestDto input, string createdById)
		{
			// Validate role
			var validRoles = new[] { RoleNames.Operator, RoleNames.EquipmentManager, RoleNames.Supporter };
			if (!validRoles.Contains(input.Role))
			{
				throw new ValidationException(_localizer["InvalidRoleSpecified"]);
			}

			if (!await _roleRepository.RoleExistsAsync(input.Role))
			{
				throw new ValidationException(_localizer["RoleDoesNotExist", input.Role]);
			}

			// Check if email already exists
			var existingUserByEmail = await _userRepository.FindByEmailAsync(input.Email);
			if (existingUserByEmail != null)
			{
				throw new ValidationException(_localizer["EmailAlreadyExists"]);
			}

			// Check if username already exists
			var existingUserByUsername = await _userRepository.FindByNameAsync(input.Username);
			if (existingUserByUsername != null)
			{
				throw new ValidationException(_localizer["UsernameAlreadyExists"]);
			}

			var user = new AppUser
			{
				Email = input.Email,
				UserName = input.Username,
				FullName = input.FullName ?? string.Empty,
				PhoneNumber = input.PhoneNumber,
				Department = input.Department,
				EmailConfirmed = true,
				IsActive = true,
				DateCreated = DateTime.UtcNow,
				CreatedBy = Guid.Parse(createdById),
				MustChangePasswordOnLogin = true
			};

			var result = await _userRepository.CreateAsync(user, input.Password);
			if (!result.Succeeded)
			{
				foreach (var error in result.Errors)
				{
					if (error.Code == "InvalidUserName")
					{
						throw new ValidationException($"username:{error.Description}");
					}

					if (error.Code.StartsWith("Password"))
					{
						throw new ValidationException($"password:{error.Description}");
					}
				}

				var errors = string.Join(", ", result.Errors.Select(e => e.Description));
				throw new ValidationException(_localizer["FailedToCreateAccount", errors]);
			}

			// Add role to user
			var roleResult = await _userRepository.AddToRoleAsync(user, input.Role);
			if (!roleResult.Succeeded)
			{
				await _userRepository.DeleteAsync(user);
				var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
				throw new ValidationException(_localizer["FailedToAssignRole", errors]);
			}

			return user.Id.ToString();
		}

		public async Task<bool> UpdateAccountAsync(string accountId, UpdateAccountRequestDto input, string updatedById)
		{
			if (!Guid.TryParse(accountId, out var userId))
			{
				return false;
			}
			var user = await _userRepository.FindByIdAsync(userId);
			if (user == null) return false;

			var hasChanges = false;
			var wasActiveChanged = false;

			if (input.FullName != null && input.FullName != user.FullName)
			{
				user.FullName = input.FullName;
				hasChanges = true;
			}

			if (input.PhoneNumber != null && input.PhoneNumber != user.PhoneNumber)
			{
				user.PhoneNumber = input.PhoneNumber;
				hasChanges = true;
			}

			if (input.Department != null && input.Department != user.Department)
			{
				user.Department = input.Department;
				hasChanges = true;
			}

			if (input.IsActive.HasValue && input.IsActive.Value != user.IsActive)
			{
				user.IsActive = input.IsActive.Value;
				wasActiveChanged = true;
				hasChanges = true;
			}

			if (hasChanges)
			{
				user.DateModified = DateTime.UtcNow;
				user.ModifiedBy = Guid.Parse(updatedById);

				var result = await _userRepository.UpdateAccount(user);
				
				// Revoke tokens if account was disabled
				if (result.Succeeded && wasActiveChanged && !user.IsActive)
				{
					await _userRepository.RemoveAllTokensForUserAsync(userId);
				}
				
				return result.Succeeded;
			}

			return true;
		}

		public async Task<bool> DisableAccountAsync(string accountId, DisableAccountRequestDto input, string disabledById)
		{
			if (!Guid.TryParse(accountId, out var userId))
			{
				return false;
			}
			var user = await _userRepository.FindByIdAsync(userId);
			if (user == null) return false;

			user.IsActive = false;
			user.DateModified = DateTime.UtcNow;
			user.ModifiedBy = Guid.Parse(disabledById);
			user.DisabledReason = input.Reason;
			user.DisabledAt = DateTime.UtcNow;

			var result = await _userRepository.UpdateAccount(user);
			
			// Revoke all refresh tokens to force logout
			if (result.Succeeded)
			{
				await _userRepository.RemoveAllTokensForUserAsync(userId);
			}
			
			return result.Succeeded;
		}

		public async Task<bool> EnableAccountAsync(string accountId, string enabledById)
		{
			if (!Guid.TryParse(accountId, out var userId))
			{
				return false;
			}
			var user = await _userRepository.FindByIdAsync(userId);
			if (user == null) return false;

			user.IsActive = true;
			user.DateModified = DateTime.UtcNow;
			user.ModifiedBy = Guid.Parse(enabledById);
			user.DisabledReason = null;
			user.DisabledAt = null;

			var result = await _userRepository.UpdateAccount(user);
			return result.Succeeded;
		}

		public async Task<bool> DeleteAccountAsync(string accountId, string deletedById)
		{
			if (!Guid.TryParse(accountId, out var userId))
			{
				return false;
			}
			var user = await _userRepository.FindByIdAsync(userId);
			if (user == null) return false;

			// Soft delete by disabling the account
			user.IsActive = false;
			user.DateModified = DateTime.UtcNow;
			user.ModifiedBy = Guid.Parse(deletedById);
			user.DisabledReason = "Account deleted by administrator";
			user.DisabledAt = DateTime.UtcNow;

			var result = await _userRepository.UpdateAccount(user);
			
			// Revoke all refresh tokens to force logout
			if (result.Succeeded)
			{
				await _userRepository.RemoveAllTokensForUserAsync(userId);
			}
			
			return result.Succeeded;
		}

		public async Task<IEnumerable<AccountResponseDto>> GetAccountsByRoleAsync(string role)
		{
			var usersInRole = await _userRepository.GetUsersInRoleAsync(role);
			var accounts = new List<AccountResponseDto>();

			foreach (var user in usersInRole)
			{
				accounts.Add(new AccountResponseDto
				{
					Id = user.Id.ToString(),
					Email = user.Email ?? string.Empty,
					Username = user.UserName ?? string.Empty,
					FullName = user.FullName,
					PhoneNumber = user.PhoneNumber,
					Role = role,
					Department = user.Department,
					IsActive = user.IsActive,
					EmailConfirmed = user.EmailConfirmed,
					CreatedAt = user.DateCreated,
					LastLoginAt = user.LastLoginAt,
					CreatedBy = user.CreatedBy.ToString()
				});
			}

			return accounts;
		}
	}
}