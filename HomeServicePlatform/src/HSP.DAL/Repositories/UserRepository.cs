using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.DAL.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HSP.DAL.Repositories
{
	public class UserRepository : IUserRepository
	{
		private readonly UserManager<AppUser> _userManager;
		private readonly ApplicationDbContext _context;

		public UserRepository(UserManager<AppUser> userManager, ApplicationDbContext context)
		{
			_userManager = userManager;
			_context = context;
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

        public async Task<IEnumerable<AppUser>> GetAllUsersAsync()
        {
            return await _userManager.Users.ToListAsync();
        }

        public async Task<AppUser?> FindByNameAsync(string username)
        {
            return await _userManager.FindByNameAsync(username);
        }

        public async Task<IdentityResult> DeleteAsync(AppUser user)
        {
            return await _userManager.DeleteAsync(user);
        }

        public async Task<IList<AppUser>> GetUsersInRoleAsync(string role)
        {
            return await _userManager.GetUsersInRoleAsync(role);
        }

        public async Task RemoveAuthenticationTokenAsync(AppUser user, string loginProvider, string tokenName)
		{
			await _userManager.RemoveAuthenticationTokenAsync(user, loginProvider, tokenName);
		}

		public async Task SetAuthenticationTokenAsync(AppUser user, string loginProvider, string tokenName, string tokenValue)
		{
			await _userManager.SetAuthenticationTokenAsync(user, loginProvider, tokenName, tokenValue);
		}

		public async Task<string?> GetAuthenticationTokenAsync(AppUser user, string loginProvider, string tokenName)
		{
			return await _userManager.GetAuthenticationTokenAsync(user, loginProvider, tokenName);
		}

		public async Task<AppUser?> FindByTokenAsync(string tokenValue, string tokenName = "RefreshToken", string loginProvider = "Default")
		{
			if (string.IsNullOrWhiteSpace(tokenValue))
				return null;

			var tokenEntry = await _context.UserTokens
					.FirstOrDefaultAsync(t =>
							t.LoginProvider == loginProvider &&
							t.Name == tokenName &&
							t.Value == tokenValue);

			if (tokenEntry == null)
				return null;

			return await _userManager.FindByIdAsync(tokenEntry.UserId.ToString());
		}

        public IQueryable<AppUser> GetUsersAsQueryable()
        {
            return _userManager.Users;
        }

        public async Task<string> GenerateChangeEmailTokenAsync(AppUser user, string newEmail)
        {
            return await _userManager.GenerateChangeEmailTokenAsync(user, newEmail);
        }

        public async Task<IdentityResult> ChangeEmailAsync(AppUser user, string newEmail, string token)
        {
            return await _userManager.ChangeEmailAsync(user, newEmail, token);
        }

        public async Task AddRefreshTokenAsync(Guid userId, string token, DateTime expires)
        {
            var entity = new RefreshToken
            {
                UserId = userId,
                Token = token,
                Expires = expires,
                IsRevoked = false
            };

            await _context.RefreshTokens.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task<RefreshToken?> GetRefreshTokenAsync(string token)
        {
            return await _context.RefreshTokens
                .FirstOrDefaultAsync(x => x.Token == token && !x.IsRevoked);
        }

        public async Task RevokeRefreshTokenAsync(string token)
        {
            var entity = await _context.RefreshTokens.FirstOrDefaultAsync(x => x.Token == token);

            if (entity != null)
            {
                entity.IsRevoked = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task RemoveAllTokensForUserAsync(Guid userId)
        {
            var tokens = _context.RefreshTokens.Where(x => x.UserId == userId);
            _context.RefreshTokens.RemoveRange(tokens);
            await _context.SaveChangesAsync();
        }
    }
}
