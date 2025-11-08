using System.Security.Claims;

namespace HSP.API.Extensions
{
	public static class ClaimsPrincipalExtensions
	{
		public static Guid GetUserId(this ClaimsPrincipal user)
		{
			var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
			if (string.IsNullOrEmpty(userId))
				throw new UnauthorizedAccessException("User is not authenticated.");

			return Guid.Parse(userId);
		}

		public static string? GetUserEmail(this ClaimsPrincipal user)
		{
			return user.FindFirstValue(ClaimTypes.Email);
		}

		public static string? GetUserRole(this ClaimsPrincipal user)
		{
			return user.FindFirstValue(ClaimTypes.Role);
		}
	}
}
