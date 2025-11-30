using HSP.API.Extensions;
using HSP.API.Filters;
using HSP.Core.Constans;
using HSP.Core.Dtos.AuthenticationDto;
using HSP.Core.Dtos.AuditLogDto;
using HSP.Core.Enums;
using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.External;
using HSP.Service.Dtos.AuthenticationDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Razor.Templating.Core;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class AuthenticationController : ControllerBase
	{
		private readonly IAuthenticationService _authenticationService;
		private readonly UrlSettingsDto _urlSettings;
		private readonly IAuthSignInService _signInService;
		private readonly IJwtService _jwtService;
		private readonly IRedisCacheService _redisCacheService;

		public AuthenticationController(IAuthenticationService authenticationService,
			IOptions<UrlSettingsDto> urlOptions,
			IJwtService jwtService,
			IRedisCacheService redisCacheService,
			IAuthSignInService signInService)
		{
			_authenticationService = authenticationService;
			_urlSettings = urlOptions.Value;
			_jwtService = jwtService;
			_redisCacheService = redisCacheService;
			_signInService = signInService;
		}

		[HttpPost("register")]
		[AllowAnonymous]
		public async Task<IActionResult> Register([FromBody] RegisterRequestDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest();
			}
			try
			{
				var result = await _authenticationService.Register(input);
				return Ok(new { message = "Please check your email to confirm your registration." });
			}
			catch (ValidationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception)
			{
				return BadRequest(new { message = "An error occurred" });
			}
		}

		[HttpPost("register-technician")]
		[AllowAnonymous]
		public async Task<IActionResult> RegisterTechnician([FromForm] RegisterTechnicianRequestDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest();
			}
			try
			{
				var result = await _authenticationService.RegisterTechnician(input);
				return Ok("Đăng ký thành công!");
			}
			catch (ValidationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (InvalidOperationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception)
			{
				return StatusCode(500, new { message = "An internal server error occurred." });
			}
		}
		[HttpPost("refresh-token")]
		public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest();
			}
			try
			{
				var result = await _jwtService.RefreshTokenAsync(input.RefreshToken);
				return Ok(result);
			}
			catch (UnauthorizedAccessException ex)
			{
				return Unauthorized(new { message = ex.Message });
			}
			catch (Exception)
			{
				return StatusCode(500, new { message = "An internal server error occurred." });
			}
		}

		[Authorize]
		[HttpPost("logout")]
		[AuditLog(AuditAction.Logout, "Authentication")]
		public async Task<IActionResult> Logout()
		{
			try
			{
				var userId = User.GetUserId();
				await _jwtService.RevokeRefreshTokenAsync(userId);
				return Ok(new { message = "Logout successful." });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { message = "Logout failed", detail = ex.Message });
			}
		}

		[HttpPost("login")]
		[AllowAnonymous]
		public async Task<IActionResult> Login([FromBody] LoginRequestDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest();
			}
			try
			{
				var result = await _authenticationService.Login(input);
				
				// Manually log the login action since user is now authenticated
				try
				{
					var auditLogService = HttpContext.RequestServices.GetService<IAuditLogService>();
					var userManager = HttpContext.RequestServices.GetService<UserManager<AppUser>>();
					
					if (auditLogService != null && userManager != null)
					{
						// Find the user who just logged in
						AppUser? user = null;
						if (input.EmailOrPhone.Contains("@"))
						{
							user = await userManager.FindByEmailAsync(input.EmailOrPhone);
						}
						else
						{
							user = await userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == input.EmailOrPhone);
						}
						
						if (user != null)
						{
							var roles = await userManager.GetRolesAsync(user);
							var userRole = roles.FirstOrDefault() ?? "Unknown";
							
							var auditLog = new CreateAuditLogDto
							{
								UserId = user.Id,
								UserName = user.UserName ?? "Unknown",
								UserRole = userRole,
								Action = AuditAction.Login,
								EntityName = "Authentication",
								Description = "User logged in"
							};
							await auditLogService.CreateAuditLogAsync(auditLog);
						}
					}
				}
				catch
				{
				}
				
				return Ok(result);
			}
			catch (ValidationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (UnauthorizedAccessException ex)
			{
				return Unauthorized(new { message = ex.Message });
			}
			catch (Exception)
			{
				return StatusCode(500, new { message = "An internal server error occurred." });
			}
		}
		[HttpGet("google-login")]
		[AllowAnonymous]
		public async Task<IActionResult> GoogleLogin()
		{
			var redirectUrl = Url.Action(nameof(GoogleCallback), "Authentication");
			if (redirectUrl == null)
			{
				return Problem("Failed to generate redirect url: " + StatusCode(500));
			}
			var properties = _signInService.ConfigureExternalAuthenticationProperties("Google", redirectUrl);
			return new ChallengeResult("Google", properties);
		}

		[HttpGet("google-callback")]
		[AllowAnonymous]
		public async Task<IActionResult> GoogleCallback()
		{
			try
			{
				var loginResponse = await _authenticationService.GoogleLogin();
				var code = Guid.NewGuid().ToString("N");
				await _redisCacheService.SetAsync($"auth:{code}",
					JsonSerializer.Serialize(loginResponse),
					TimeSpan.FromMinutes(3));
				var redirectUrl = $"{_urlSettings.FrontendLoginSuccess}?code={code}";
				return Redirect(redirectUrl);
			}
			catch (UnauthorizedAccessException ex)
			{
				// Redirect to login page with error message for banned/inactive accounts
				var errorMessage = Uri.EscapeDataString(ex.Message);
				var redirectUrl = $"{_urlSettings.FrontendLoginFailed}?error={errorMessage}";
				return Redirect(redirectUrl);
			}
			catch (Exception ex)
			{
				// Redirect to login page with generic error for other exceptions
				var errorMessage = Uri.EscapeDataString("Đăng nhập Google thất bại. Vui lòng thử lại.");
				var redirectUrl = $"{_urlSettings.FrontendLoginFailed}?error={errorMessage}";
				return Redirect(redirectUrl);
			}
		}
		[HttpGet("exchange-token")]
		[AllowAnonymous]
		public async Task<IActionResult> ExchangeToken([FromQuery] string code)
		{
			var data = await _redisCacheService.GetAsync<string>($"auth:{code}");

			if (string.IsNullOrEmpty(data))
				return Unauthorized("Code invalid or expired");

			var token = JsonSerializer.Deserialize<LoginResponseDto>(data);

			await _redisCacheService.RemoveAsync($"auth:{code}");

			return Ok(token);
		}

		[HttpGet("confirm-email")]
		[AllowAnonymous]
		public async Task<IActionResult> ConfirmEmail(Guid userId, string token)
		{
			var decodedTokenBytes = Convert.FromBase64String(token);
			var decodedToken = Encoding.UTF8.GetString(decodedTokenBytes);

			var result = await _authenticationService.ConfirmEmail(userId, decodedToken);

			if (result.Success)
			{
				result.Title = "Xác nhận email thành công";
				result.Heading = "Hoàn tất!";
				result.ActionUrl = _urlSettings.FrontendLoginFailed;
			}
			else if (result.Error == "TokenExpired")
			{
				result.Title = "Liên kết đã hết hạn";
				result.Heading = "Liên kết xác nhận hết hạn";
				result.ActionUrl = _urlSettings.FrontendLoginFailed;
			}
			else
			{
				result.Title = "Xác nhận thất bại";
				result.Heading = "Không thể xác nhận";
				result.ActionUrl = _urlSettings.FrontendLoginFailed;
			}

			var html = await RazorTemplateEngine.RenderAsync("/Views/Authentications/ConfirmEmailResult.cshtml", result);
			return new ContentResult { Content = html, ContentType = "text/html" };
		}


		[HttpPost("change-password")]
		[Authorize]
		public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}

			try
			{
				var userId = User.GetUserId();
				var result = await _authenticationService.ChangePassword(userId, input);
				return Ok(result);
			}
			catch (ValidationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception)
			{
				return StatusCode(500, new { message = "An internal server error occurred." });
			}
		}
		[HttpPost("add-password")]
		[Authorize(Roles = RoleNames.Customer)]
		public async Task<IActionResult> AddPassword([FromBody] AddPasswordDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest();
			}
			var userId = User.GetUserId();
			try
			{
				var result = await _authenticationService.AddPasswordAsync(userId, input);
				if (!result)
				{
					BadRequest();
				}
				return Ok(new { message = "PasswordAddSuccess" });
			}
			catch (ValidationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception)
			{
				return StatusCode(500, new { message = "An internal server error occurred." });
			}
		}
		[HttpPost("create-operator")]
		[Authorize(Roles = RoleNames.Admin)]
		public async Task<IActionResult> CreateOperator([FromBody] CreateOperatorRequestDto input)
		{
			if (!ModelState.IsValid) return BadRequest(ModelState);
			try
			{
				var userId = await _authenticationService.CreateOperatorAsync(input);
				return Ok(new { id = userId, message = "OperatorCreated" });
			}
			catch (ValidationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception)
			{
				return StatusCode(500, new { message = "An internal server error occurred." });
			}
		}
		[HttpPost("forget-password")]
		[AllowAnonymous]
		public async Task<IActionResult> ForgetPassword([FromBody] ForgetPasswordDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}
			try
			{
				await _authenticationService.RequestPasswordResetAsync(input);
				return Ok(new { message = "Please check your email for password reset instructions." });
			}
			catch (ValidationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception)
			{
				return StatusCode(500, new { message = "An internal server error occurred." });
			}
		}
		[HttpPost("reset-password")]
		[AllowAnonymous]
		public async Task<IActionResult> ResetPassword([FromBody] Core.Dtos.AuthenticationDto.ResetPasswordDto input)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}
			try
			{
				var result = await _authenticationService.ResetPasswordAsync(input);
				return Ok(new { message = "Password has been reset successfully." });
			}
			catch (ValidationException ex)
			{
				return BadRequest(new { message = ex.Message });
			}
			catch (Exception)
			{
				return StatusCode(500, new { message = "An internal server error occurred." });
			}
		}
	}
}
