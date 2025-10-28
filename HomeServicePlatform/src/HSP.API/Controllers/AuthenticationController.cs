using HSP.Core.Constans;
using HSP.Core.Dtos.AuthenticationDto;
using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Entities;
using HSP.Service.Dtos.AuthenticationDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Razor.Templating.Core;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class AuthenticationController : ControllerBase
	{
		private readonly IAuthenticationService _authenticationService;
		private readonly UrlSettingsDto _urlSettings;
		private readonly SignInManager<AppUser> _signInManager;
		private readonly IJwtService _jwtService;

		public AuthenticationController(IAuthenticationService authenticationService,
			IOptions<UrlSettingsDto> urlOptions,
			IJwtService jwtService,
			SignInManager<AppUser> signInManager)
		{
			_authenticationService = authenticationService;
			_urlSettings = urlOptions.Value;
			_jwtService = jwtService;
			_signInManager = signInManager;
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
		public async Task<IActionResult> RegisterTechnician([FromBody] RegisterTechnicianRequestDto input)
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
			catch (Exception)
			{
				return BadRequest(new { message = "An error occurred" });
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
		public async Task<IActionResult> Logout()
		{
			try
			{
				var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
				if (string.IsNullOrEmpty(userIdClaim))
					return Unauthorized(new { message = "Invalid user identity." });

				var userId = Guid.Parse(userIdClaim);

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
		public IActionResult GoogleLogin()
		{
			var redirectUrl = Url.Action(nameof(GoogleCallback), "Authentication");
			var properties = _signInManager.ConfigureExternalAuthenticationProperties("Google", redirectUrl);
			return new ChallengeResult("Google", properties);
		}

		[HttpGet("google-callback")]
		[AllowAnonymous]
		public async Task<IActionResult> GoogleCallback()
		{
			var loginResponse = await _authenticationService.GoogleLogin();
			var frontendSuccessUrl = _urlSettings.FrontendLoginSuccess;
			var redirectUrl = $"{frontendSuccessUrl}?accesstoken={loginResponse.JwtToken.AccessToken}&refreshtoken={loginResponse.JwtToken.RefreshToken}&requirePasswordSetup={loginResponse.RequirePasswordSetup}";
			return Redirect(redirectUrl);
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
				// Lấy user ID từ JWT token
				var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
				if (!Guid.TryParse(userIdClaim, out var userId))
				{
					return Unauthorized(new { message = "Invalid user token" });
				}

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
			var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
			if (userIdString == null || !Guid.TryParse(userIdString, out var userId))
			{
				return Unauthorized();
			}
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
