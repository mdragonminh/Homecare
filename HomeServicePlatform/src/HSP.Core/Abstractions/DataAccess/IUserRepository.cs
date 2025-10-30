using HSP.Core.Entities;
using Microsoft.AspNetCore.Identity;

namespace HSP.Core.Interfaces.DataAccess
{
	public interface IUserRepository
	{
		Task<IdentityResult> CreateAsync(AppUser user, string password);
		Task<AppUser?> FindByIdAsync(Guid id);
		Task<AppUser?> FindByEmailAsync(string email);
		Task<AppUser?> FindByPhoneNumberAsync(string phoneNumber);
		Task<bool> CheckPasswordAsync(AppUser user, string password);
		Task<string> GenerateEmailConfirmationTokenAsync(AppUser user);
		Task<IdentityResult> ConfirmEmailAsync(AppUser user, string token);
		Task<string> GeneratePasswordResetTokenAsync(AppUser user);
		Task<IdentityResult> ResetPasswordAsync(AppUser user, string token, string newPassword);
		Task<IdentityResult> ChangePasswordAsync(AppUser user, string currentPassword, string newPassword);
		Task<IList<string>> GetRolesAsync(AppUser user);
		Task<IdentityResult> AddToRoleAsync(AppUser user, string role);
		Task<IdentityResult> UpdateAccount(AppUser user);

        Task<IEnumerable<AppUser>> GetAllUsersAsync();
        Task<AppUser?> FindByNameAsync(string username);
        Task<IdentityResult> DeleteAsync(AppUser user);
        Task<IList<AppUser>> GetUsersInRoleAsync(string role);

        Task<IList<UserLoginInfo>> GetLoginsAsync(AppUser user);
		Task<IdentityResult> AddLoginAsync(AppUser user, UserLoginInfo login);

		Task<AppUser?> FindByLoginAsync(string loginProvider, string providerKey);
		Task<IdentityResult> CreateAsync(AppUser user);
		Task<IdentityResult> AddPasswordAsync(AppUser user, string password);
		Task<string> GenerateUserTokenAsync(AppUser user,string tokenProvider,string purpose);
		Task<bool> VerifyUserTokenAsync(AppUser user,string tokenProvider,string purpose,string token);
		Task RemoveAuthenticationTokenAsync(AppUser user, string loginProvider, string tokenName);
		Task SetAuthenticationTokenAsync(AppUser user, string loginProvider, string tokenName, string tokenValue);
		Task<string?> GetAuthenticationTokenAsync(AppUser user, string loginProvider, string tokenName);
		Task<AppUser?> FindByTokenAsync(string tokenValue, string tokenName = "RefreshToken", string loginProvider = "Default");
	}
}
