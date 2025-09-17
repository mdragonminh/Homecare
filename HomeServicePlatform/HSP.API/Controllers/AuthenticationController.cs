using HSP.Service.Dtos.AuthenticationDto;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class AuthenticationController : ControllerBase
	{
		private readonly IAuthenticationService _authenticationService;
		private readonly IEmailService _emailService;

		public AuthenticationController(IAuthenticationService authenticationService, IEmailService emailService)
		{
			_authenticationService = authenticationService;
			_emailService = emailService;
		}

		[HttpPost("register")]
		[AllowAnonymous]
		public async Task<IActionResult> Register([FromBody] RegisterRequestDto input)
		{
			var result = await _authenticationService.Register(input);
			var tokenBytes = Encoding.UTF8.GetBytes(result.EmailConfirmToken);
			var base64Token = Convert.ToBase64String(tokenBytes);
			var confirmUrl = $"https://localhost:7190/api/Authentication/confirm-email?userId={result.UserId}&token={base64Token}";
			var emailDto = new EmailDto
			{
				ToEmail = result.Email,
				Subject = "Please confirm your email",
				HtmlBody = $"<p>Hello {input.FullName},</p><p>Click the link to confirm your email: <a href=\"{confirmUrl}\">Confirm Email</a></p>",
				TextBody = $"Hello {input.FullName},\nClick the link to confirm your email: {confirmUrl}"
			};
			Task.Run(() => _emailService.SendEmailAsync(emailDto));

			return Ok(new { message = "Please check your email to confirm your registration." });
		}
		[HttpGet("confirm-email")]
		[AllowAnonymous]
		public async Task<IActionResult> ConfirmEmail(Guid userId, string token)
		{
			var decodedTokenBytes = Convert.FromBase64String(token);
			var decodedToken = Encoding.UTF8.GetString(decodedTokenBytes);
			var success = await _authenticationService.ConfirmEmail(userId, decodedToken);
			return success ? Ok("Email confirmed successfully") : BadRequest("Email confirmation failed");
		}
	}
}
