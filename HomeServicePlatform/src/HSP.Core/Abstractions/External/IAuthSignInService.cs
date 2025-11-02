using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace HSP.Service.Interfaces
{
	public interface IAuthSignInService
	{
		Task<ExternalLoginInfo?> GetExternalLoginInfoAsync();
		Task<SignInResult> PasswordSignInAsync(string email, string password, bool isPersistent);
		AuthenticationProperties ConfigureExternalAuthenticationProperties(string provider, string redirectUrl);
	}
}
