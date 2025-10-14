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

		public Task<IdentityResult> AddLoginAsync(AppUser user, UserLoginInfo login)
		{
			return _userManager.AddLoginAsync(user, login);
		}

		public Task<IdentityResult> AddPasswordAsync(AppUser user, string password)
		{
			return _userManager.AddPasswordAsync(user, password);
		}

		public Task<IdentityResult> AddToRoleAsync(AppUser user, string role)
		{
			return _userManager.AddToRoleAsync(user, role);
		}

		public Task<bool> CheckPasswordAsync(AppUser user, string password)
		{
			return _userManager.CheckPasswordAsync(user, password);
		}

		public Task<IdentityResult> ConfirmEmailAsync(AppUser user, string token)
		{
			return _userManager.ConfirmEmailAsync(user, token);
		}

		public Task<IdentityResult> CreateAsync(AppUser user, string password)
		{
			return _userManager.CreateAsync(user, password);
		}

		public Task<IdentityResult> CreateAsync(AppUser user)
		{
			return _userManager.CreateAsync(user);
		}

		public Task<AppUser?> FindByEmailAsync(string email)
		{
			return _userManager.FindByEmailAsync(email);
		}

		public Task<AppUser?> FindByPhoneNumberAsync(string phoneNumber)
		{
			return Task.FromResult(_userManager.Users.FirstOrDefault(u => u.PhoneNumber == phoneNumber));
		}

		public Task<AppUser?> FindByIdAsync(Guid id)
		{
			return _userManager.FindByIdAsync(id.ToString());
		}

		public Task<AppUser?> FindByLoginAsync(string loginProvider, string providerKey)
		{
			return _userManager.FindByLoginAsync(loginProvider, providerKey);
		}

		public Task<string> GenerateEmailConfirmationTokenAsync(AppUser user)
		{
			return _userManager.GenerateEmailConfirmationTokenAsync(user);
		}

		public Task<string> GeneratePasswordResetTokenAsync(AppUser user)
		{
			return _userManager.GeneratePasswordResetTokenAsync(user);
		}

		public Task<IList<UserLoginInfo>> GetLoginsAsync(AppUser user)
		{
			return _userManager.GetLoginsAsync(user);
		}

		public Task<IList<string>> GetRolesAsync(AppUser user)
		{
			return _userManager.GetRolesAsync(user);
		}

		public Task<IdentityResult> ResetPasswordAsync(AppUser user, string token, string newPassword)
		{
			return _userManager.ResetPasswordAsync(user, token, newPassword);
		}

		public Task<IdentityResult> ChangePasswordAsync(AppUser user, string currentPassword, string newPassword)
		{
			return _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
		}
	}
}
