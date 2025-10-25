using HSP.Core.Constans;
using HSP.Core.Dtos.AccountDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using System.ComponentModel.DataAnnotations;

namespace HSP.Service.Implementations
{
    public class AccountManagementService : BaseService, IAccountManagementService
    {
        private readonly IUserRepository _userRepository;
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<AppRole> _roleManager;

        public AccountManagementService(
            IUserRepository userRepository,
            UserManager<AppUser> userManager,
            RoleManager<AppRole> roleManager,
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
        {
            _userRepository = userRepository;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task<PagedList<AccountResponseDto>> GetAccountsAsync(AccountFilterDto filter)
        {
            // Get all users with management roles
            var allUsers = await _userManager.Users.ToListAsync();
            var accountDtos = new List<AccountResponseDto>();

            foreach (var user in allUsers)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var userRole = roles.FirstOrDefault();

                // Only include management roles (exclude customer and technician)
                if (userRole == RoleNames.Customer || userRole == RoleNames.Technician)
                {
                    continue;
                }

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
                    CreatedBy = user.CreatedBy
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
            var user = await _userManager.FindByIdAsync(accountId);
            if (user == null) return null;

            var roles = await _userManager.GetRolesAsync(user);
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
                CreatedBy = user.CreatedBy
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

            // Check if role exists
            if (!await _roleManager.RoleExistsAsync(input.Role))
            {
                throw new ValidationException(_localizer["RoleDoesNotExist", input.Role]);
            }

            // Check if email already exists
            var existingUserByEmail = await _userManager.FindByEmailAsync(input.Email);
            if (existingUserByEmail != null)
            {
                throw new ValidationException(_localizer["EmailAlreadyExists"]);
            }

            // Check if username already exists
            var existingUserByUsername = await _userManager.FindByNameAsync(input.Username);
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
                EmailConfirmed = true, // Auto-confirm for admin created accounts
                IsActive = true,
                DateCreated = DateTime.UtcNow,
                CreatedBy = createdById,
                MustChangePasswordOnLogin = true
            };

            var result = await _userManager.CreateAsync(user, input.Password);
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
            var roleResult = await _userManager.AddToRoleAsync(user, input.Role);
            if (!roleResult.Succeeded)
            {
                await _userManager.DeleteAsync(user); // Cleanup if role assignment fails
                var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
                throw new ValidationException(_localizer["FailedToAssignRole", errors]);
            }

            return user.Id.ToString();
        }

        public async Task<bool> UpdateAccountAsync(string accountId, UpdateAccountRequestDto input, string updatedById)
        {
            var user = await _userManager.FindByIdAsync(accountId);
            if (user == null) return false;

            var hasChanges = false;

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
                hasChanges = true;
            }

            if (hasChanges)
            {
                user.DateModified = DateTime.UtcNow;
                user.UpdatedBy = updatedById;

                var result = await _userManager.UpdateAsync(user);
                return result.Succeeded;
            }

            return true;
        }

        public async Task<bool> DisableAccountAsync(string accountId, DisableAccountRequestDto input, string disabledById)
        {
            var user = await _userManager.FindByIdAsync(accountId);
            if (user == null) return false;

            user.IsActive = false;
            user.DateModified = DateTime.UtcNow;
            user.UpdatedBy = disabledById;
            user.DisabledReason = input.Reason;
            user.DisabledAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            return result.Succeeded;
        }

        public async Task<bool> EnableAccountAsync(string accountId, string enabledById)
        {
            var user = await _userManager.FindByIdAsync(accountId);
            if (user == null) return false;

            user.IsActive = true;
            user.DateModified = DateTime.UtcNow;
            user.UpdatedBy = enabledById;
            user.DisabledReason = null;
            user.DisabledAt = null;

            var result = await _userManager.UpdateAsync(user);
            return result.Succeeded;
        }

        public async Task<bool> DeleteAccountAsync(string accountId, string deletedById)
        {
            var user = await _userManager.FindByIdAsync(accountId);
            if (user == null) return false;

            // Soft delete by disabling the account
            user.IsActive = false;
            user.DateModified = DateTime.UtcNow;
            user.UpdatedBy = deletedById;
            user.DisabledReason = "Account deleted by administrator";
            user.DisabledAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            return result.Succeeded;
        }

        public async Task<IEnumerable<AccountResponseDto>> GetAccountsByRoleAsync(string role)
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(role);
            var accounts = new List<AccountResponseDto>();

            foreach (var user in usersInRole.Where(u => true))
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
                    CreatedBy = user.CreatedBy
                });
            }

            return accounts;
        }
    }
}