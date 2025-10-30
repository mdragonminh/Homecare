using HSP.Core.Entities;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace HSP.Service.Implementations
{
	public class AuthSignInService : IAuthSignInService
	{
		private readonly SignInManager<AppUser> _signInManager;
		public AuthSignInService(SignInManager<AppUser> signInManager)
		{
			_signInManager = signInManager;
		}

		public AuthenticationProperties ConfigureExternalAuthenticationProperties(string provider, string redirectUrl)
		{
			if(redirectUrl == null || provider == null)
			{
				throw new ArgumentNullException("redirect url or provider is null");
			}
			return _signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl);
		}

		public async Task<ExternalLoginInfo?> GetExternalLoginInfoAsync()
		{
			return await _signInManager.GetExternalLoginInfoAsync();
		}
		public async Task<SignInResult> PasswordSignInAsync(string email, string password, bool isPersistent)
		{
			if(email == null || password == null)
			{
				throw new ArgumentNullException("email or password is null");
			}
			return await _signInManager.PasswordSignInAsync(email, password, isPersistent, lockoutOnFailure: false);
		}
	}
}
