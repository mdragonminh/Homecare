using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using Microsoft.AspNetCore.Identity;

namespace HSP.DAL.Repositories
{
	public class UserRepository : IUserRepository
	{
		private readonly UserManager<AppUser> _userManager;

		public UserRepository(UserManager<AppUser> userManager)
		{
			_userManager = userManager;
		}

		public async Task<IdentityResult> AddLoginAsync(AppUser user, UserLoginInfo login)
		{
			return await _userManager.AddLoginAsync(user, login);
		}

		public async Task<IdentityResult> AddPasswordAsync(AppUser user, string password)
		{
			return await _userManager.AddPasswordAsync(user, password);
		}

		public async Task<IdentityResult> AddToRoleAsync(AppUser user, string role)
		{
			return await _userManager.AddToRoleAsync(user, role);
		}

		public async Task<bool> CheckPasswordAsync(AppUser user, string password)
		{
			return await _userManager.CheckPasswordAsync(user, password);
		}

		public async Task<IdentityResult> ConfirmEmailAsync(AppUser user, string token)
		{
			return await _userManager.ConfirmEmailAsync(user, token);
		}

		public async Task<IdentityResult> CreateAsync(AppUser user, string password)
		{
			return await _userManager.CreateAsync(user, password);
		}

		public async Task<IdentityResult> CreateAsync(AppUser user)
		{
			return await _userManager.CreateAsync(user);
		}

		public async Task<AppUser?> FindByEmailAsync(string email)
		{
			return await _userManager.FindByEmailAsync(email);
		}

		public async Task<AppUser?> FindByPhoneNumberAsync(string phoneNumber)
		{
			return await Task.FromResult(_userManager.Users.FirstOrDefault(u => u.PhoneNumber == phoneNumber));
		}

		public async Task<AppUser?> FindByIdAsync(Guid id)
		{
			return await _userManager.FindByIdAsync(id.ToString());
		}

		public async Task<AppUser?> FindByLoginAsync(string loginProvider, string providerKey)
		{
			return await _userManager.FindByLoginAsync(loginProvider, providerKey);
		}

		public async Task<string> GenerateEmailConfirmationTokenAsync(AppUser user)
		{
			return await _userManager.GenerateEmailConfirmationTokenAsync(user);
		}

		public async Task<string> GeneratePasswordResetTokenAsync(AppUser user)
		{
			return await _userManager.GeneratePasswordResetTokenAsync(user);
		}

		public async Task<IList<UserLoginInfo>> GetLoginsAsync(AppUser user)
		{
			return await _userManager.GetLoginsAsync(user);
		}

		public async Task<IList<string>> GetRolesAsync(AppUser user)
		{
			return await _userManager.GetRolesAsync(user);
		}

		public async Task<IdentityResult> ResetPasswordAsync(AppUser user, string token, string newPassword)
		{
			return await _userManager.ResetPasswordAsync(user, token, newPassword);
		}

		public async Task<IdentityResult> ChangePasswordAsync(AppUser user, string currentPassword, string newPassword)
		{
			return await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
		}

		public async Task<string> GenerateUserTokenAsync(AppUser user, string tokenProvider, string purpose)
		{
			return await _userManager.GenerateUserTokenAsync(user, tokenProvider, purpose);
		}

		public async Task<bool> VerifyUserTokenAsync(AppUser user, string tokenProvider, string purpose, string token)
		{
			return await _userManager.VerifyUserTokenAsync(user, tokenProvider, purpose, token);
		}

		public async Task<IdentityResult> UpdateAccount(AppUser user)
		{
			return await _userManager.UpdateAsync(user);
		}
	}
}
