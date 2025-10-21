using HSP.Core.Constans;
using HSP.Core.Dtos.AccountDto;
using HSP.Core.Dtos.AuthenticationDto;
using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Dtos.AuthenticationDto;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HSP.Service.Implementations
{
	public class AuthenticationService : BaseService, IAuthenticationService
	{
		private readonly IUserRepository _userRepository;
		private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;
		//private readonly IRepository<CustomerProfile, Guid> _customerProfileRepository;
		private readonly SignInManager<AppUser> _signInManager;
		//private readonly JwtSettingsDto _jwtSettings;
		private readonly UrlSettingsDto _urlSettings;
		private readonly IJwtService _jwtService;
		private readonly IEmailService _emailService;
		private readonly IEmailTemplateService _emailTemplateService;

		public AuthenticationService(IUserRepository userRepository,
			//IOptions<JwtSettingsDto> jwtOptions,
			IOptions<UrlSettingsDto> urlOptions,
			IRepository<TechnicianProfile, Guid> technicianRepository,
			//IRepository<CustomerProfile, Guid> customerProfileRepository,
			SignInManager<AppUser> signInManager,
			IJwtService jwtService,
			IEmailService emailService,
			IEmailTemplateService emailTemplateService,
			IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_userRepository = userRepository;
			//_jwtSettings = jwtOptions.Value;
			_urlSettings = urlOptions.Value;
			_technicianRepository = technicianRepository;
			_signInManager = signInManager;
			_jwtService = jwtService;
			//_customerProfileRepository = customerProfileRepository;
			_emailService = emailService;
			_emailTemplateService = emailTemplateService;
		}

		public async Task<ConfirmEmailResultDto> ConfirmEmail(Guid userId, string token)
		{
			var user = await _userRepository.FindByIdAsync(userId);
			if (user == null)
			{
				return new ConfirmEmailResultDto { Success = false, Error = "UserNotFound", Message = "User not found" };
			}
			var result = await _userRepository.ConfirmEmailAsync(user, token);
			if (result.Succeeded)
			{
				return new ConfirmEmailResultDto { Success = true, Message = "Email confirmed" };
			}
			if (result.Errors.Any(e => e.Code.Contains("InvalidToken")))
			{
				return new ConfirmEmailResultDto { Success = false, Error = "InvalidToken", Message = "Invalid token" };
			}

			if (result.Errors.Any(e => e.Code.Contains("TokenExpired")))
			{
				return new ConfirmEmailResultDto { Success = false, Error = "TokenExpired", Message = "Token expired" };
			}

			return new ConfirmEmailResultDto { Success = false, Error = "UnknownError", Message = "Email confirmation failed" };
		}

		public async Task<LoginResponseDto> Login(LoginRequestDto input)
		{
			if (input == null)
			{
				throw new ArgumentException(_localizer["InputCannotBeNull"]);
			}

			// Tìm user bằng email hoặc số điện thoại
			AppUser? user = null;

			// Kiểm tra xem input có phải là email không
			if (IsValidEmail(input.EmailOrPhone))
			{
				user = await _userRepository.FindByEmailAsync(input.EmailOrPhone);
			}
			else
			{
				// Tìm bằng số điện thoại
				user = await _userRepository.FindByPhoneNumberAsync(input.EmailOrPhone);
			}

			if (user == null)
			{
				throw new ValidationException(_localizer["InvalidEmail"]);
			}
			if (!user.EmailConfirmed)
			{
				throw new UnauthorizedAccessException(_localizer["EmailNotConfirmed"]);
			}
			bool passwordValid = await _userRepository.CheckPasswordAsync(user, input.Password);
			if (!passwordValid)
			{
				throw new UnauthorizedAccessException(_localizer["InvalidPassword"]);
			}
			var token = await _jwtService.GenerateJwtToken(new UserDto
			{
				Id = user.Id,
				Email = user.Email ?? string.Empty,
				FullName = user.FullName ?? string.Empty
			});
			return new LoginResponseDto
			{
				JwtToken = token,
				RequirePasswordSetup = string.IsNullOrEmpty(user.PasswordHash)
			};
		}
		public async Task<LoginResponseDto> GoogleLogin()
		{
			var info = await _signInManager.GetExternalLoginInfoAsync();
			if (info == null)
			{
				throw new Exception(_localizer["ErrorLoadingGoogleLogin"]);
			}

			var user = await FindOrCreateUserAsync(info);
			if (user == null)
			{
				throw new Exception(_localizer["CannotFindOrCreateUser"]);
			}

			var token = await _jwtService.GenerateJwtToken(new Core.Dtos.AccountDto.UserDto
			{
				Id = user.Id,
				Email = user.Email ?? string.Empty,
				FullName = user.FullName ?? string.Empty
			});
			return new LoginResponseDto
			{
				JwtToken = token,
				RequirePasswordSetup = string.IsNullOrEmpty(user.PasswordHash)
			};
		}
		private async Task<AppUser> FindOrCreateUserAsync(ExternalLoginInfo info)
		{
			var user = await _userRepository.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
			if (user != null)
			{
				return user;
			}

			var email = info.Principal.FindFirstValue(ClaimTypes.Email);
			if (string.IsNullOrEmpty(email))
			{
				throw new Exception(_localizer["EmailNotFoundFromProvider"]);
			}

			user = await _userRepository.FindByEmailAsync(email);

			if (user == null)
			{
				user = await CreateNewUserAsync(info, email);
			}

			var addLoginResult = await _userRepository.AddLoginAsync(user, info);
			if (!addLoginResult.Succeeded)
			{
				throw new Exception(_localizer["GoogleLinkFailed"]);
			}
			return user;
		}
		private async Task<AppUser> CreateNewUserAsync(ExternalLoginInfo info, string email)
		{
			var user = new AppUser
			{
				UserName = email,
				Email = email,
				FullName = info.Principal.FindFirstValue(ClaimTypes.Name) ?? email,
				EmailConfirmed = true
			};


			var createResult = await _userRepository.CreateAsync(user);
			if (!createResult.Succeeded)
			{
				throw new Exception(_localizer["UserCreationFailed"]);
			}

			var roleResult = await _userRepository.AddToRoleAsync(user, RoleNames.Customer);
			if (!roleResult.Succeeded)
			{
				throw new Exception(_localizer["AddToRoleFailed"]);
			}

			return user;
		}

		private static bool IsValidEmail(string input)
		{
			try
			{
				var emailRegex = new System.Text.RegularExpressions.Regex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$");
				return emailRegex.IsMatch(input);
			}
			catch
			{
				return false;
			}
		}

		public async Task<ChangePasswordResponseDto> ChangePassword(Guid userId, ChangePasswordRequestDto input)
		{
			if (input == null)
				throw new ArgumentException(_localizer["InputCannotBeNull"]);

			var user = await _userRepository.FindByIdAsync(userId);
			if (user == null)
				throw new ValidationException(_localizer["UserNotFound"]);

			// Kiểm tra mật khẩu hiện tại
			var checkPassword = await _userRepository.CheckPasswordAsync(user, input.CurrentPassword);
			if (!checkPassword)
				throw new ValidationException(_localizer["CurrentPasswordIncorrect"]);

			// Đổi mật khẩu
			var result = await _userRepository.ChangePasswordAsync(user, input.CurrentPassword, input.NewPassword);
			if (!result.Succeeded)
			{
				var errors = string.Join(", ", result.Errors.Select(e => e.Description));
				throw new ValidationException($"{_localizer["PasswordChangeFailed"]}: {errors}");
			}

			return new ChangePasswordResponseDto
			{
				Message = _localizer["PasswordChangeSuccess"]
			};
		}

		public async Task<RegisterResponseDto> Register(RegisterRequestDto input)
		{
			if (input == null)
				throw new ArgumentException(_localizer["InputCannotBeNull"]);

			if (input.Password != input.ConfirmPassword)
				throw new ValidationException(_localizer["PasswordsDoNotMatch"]);
			var userExisting = await _userRepository.FindByEmailAsync(input.Email);
			if (userExisting != null)
			{
				return await HandleExistingUserAsync(userExisting);
			}
			var user = await CreateCustomerAsync(input);
			await _userRepository.AddToRoleAsync(user, RoleNames.Customer);
			var token = await _userRepository.GenerateEmailConfirmationTokenAsync(user);
			await SendConfirmationEmailAsync(user, token);

			return new RegisterResponseDto
			{
				UserId = user.Id,
				Email = user.Email,
				EmailConfirmToken = token
			};
		}


		private async Task<AppUser> CreateCustomerAsync(RegisterRequestDto input)
		{
			var user = new AppUser
			{
				Email = input.Email,
				UserName = input.Email,
				FullName = input.FullName,
				PhoneNumber = input.PhoneNumber,
				EmailConfirmed = false,
			};

			var created = await _userRepository.CreateAsync(user, input.Password);
			if (!created.Succeeded)
				throw new Exception(_localizer["UserCreationFailed"]);
			return user;
		}

		private async Task<RegisterResponseDto> HandleExistingUserAsync(AppUser userExisting)
		{
			if (userExisting.EmailConfirmed)
			{
				throw new ValidationException(_localizer["EmailAlreadyExists"]);
			}

			var newToken = await _userRepository.GenerateEmailConfirmationTokenAsync(userExisting);
			await SendConfirmationEmailAsync(userExisting, newToken);

			return new RegisterResponseDto
			{
				UserId = userExisting.Id,
				Email = userExisting.Email,
				EmailConfirmToken = newToken
			};
		}
		public async Task<RegisterResponseDto> RegisterTechnician(RegisterTechnicianRequestDto input)
		{
			if (input == null)
				throw new ArgumentException(_localizer["InputCannotBeNull"]);

			// Kiểm tra email đã tồn tại chưa
			var existingUser = await _userRepository.FindByEmailAsync(input.Email);
			if (existingUser != null)
				throw new ValidationException(_localizer["EmailAlreadyExists"]);

			// Bắt đầu transaction trên DbContext dùng chung giữa Identity và Repository
			await _unitOfWork.BeginTransactionAsync();
			try
			{
				// Tạo user với password mặc định "123Qwe@@"
				var user = new AppUser
				{
					Email = input.Email,
					UserName = input.Email,
					FullName = input.FullName,
					PhoneNumber = input.PhoneNumber,
					EmailConfirmed = false
				};

				var created = await _userRepository.CreateAsync(user, "123Qwe@@");
				if (!created.Succeeded)
				{
					var errors = string.Join(", ", created.Errors.Select(e => e.Description));
					throw new ValidationException($"{_localizer["UserCreationFailed"]}: {errors}");
				}
				// Đảm bảo lưu user vào AppUsers
				await _unitOfWork.SaveChangesAsync();

				// Thêm role Technician
				var roleResult = await _userRepository.AddToRoleAsync(user, RoleNames.Technician);
				if (!roleResult.Succeeded)
				{
					var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
					throw new ValidationException($"{_localizer["AddToRoleFailed"]}: {errors}");
				}
				// Lưu quan hệ role
				await _unitOfWork.SaveChangesAsync();

				// Tạo TechnicianProfile
				var technicianProfile = new TechnicianProfile
				{
					UserId = user.Id,
					//SkillSet = input.SkillSet,
					ExperienceYears = input.ExperienceYears,
					//CertificatePaths = input.CertificateFilePaths?.Any() == true
					//	? System.Text.Json.JsonSerializer.Serialize(input.CertificateFilePaths)
					//	: null,
					DateCreated = DateTime.UtcNow,
					DateModified = DateTime.UtcNow,
					IsDeleted = false
				};

				await _technicianRepository.AddAsync(technicianProfile);
				await _unitOfWork.SaveChangesAsync();

				// Tạo email confirmation token
				var token = await _userRepository.GenerateEmailConfirmationTokenAsync(user);

				// Commit transaction (bao gồm tất cả thay đổi)
				await _unitOfWork.CommitTransactionAsync();

				return new RegisterResponseDto
				{
					UserId = user.Id,
					Email = user.Email,
					EmailConfirmToken = token
				};
			}
			catch
			{
				await _unitOfWork.RollbackTransactionAsync();
				throw;
			}
		}

		public async Task<bool> AddPasswordAsync(Guid userId, AddPasswordDto input)
		{
			var user = _userRepository.FindByIdAsync(userId).Result;
			if (user == null) throw new ValidationException("User not found");
			if (!string.IsNullOrEmpty(user.PasswordHash))
			{
				throw new ValidationException("User already has a password");
			}
			if (input.NewPassword != input.ConfirmPassword)
			{
				throw new ValidationException("Password and Confirm Password do not match");
			}
			var result = await _userRepository.AddPasswordAsync(user, input.NewPassword);
			if (!result.Succeeded) throw new Exception("Add password failed");
			return result.Succeeded;
		}
		public async Task<Guid> CreateOperatorAsync(CreateOperatorRequestDto input)
		{
			if (input == null)
				throw new ArgumentException(_localizer["InputCannotBeNull"]);

			// Kiểm tra email tồn tại
			var existingByEmail = await _userRepository.FindByEmailAsync(input.Email);
			if (existingByEmail != null)
				throw new ValidationException(_localizer["EmailAlreadyExists"]);

			await _unitOfWork.BeginTransactionAsync();
			try
			{
				var user = new AppUser
				{
					Email = input.Email,
					UserName = input.Username,
					FullName = input.Username,
					EmailConfirmed = true
				};

				var createResult = await _userRepository.CreateAsync(user, input.Password);
				if (!createResult.Succeeded)
				{
					var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
					throw new ValidationException($"{_localizer["UserCreationFailed"]}: {errors}");
				}
				await _unitOfWork.SaveChangesAsync();

				var roleResult = await _userRepository.AddToRoleAsync(user, RoleNames.Operator);
				if (!roleResult.Succeeded)
				{
					var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
					throw new ValidationException($"{_localizer["AddToRoleFailed"]}: {errors}");
				}
				await _unitOfWork.SaveChangesAsync();

				await _unitOfWork.CommitTransactionAsync();
				return user.Id;
			}
			catch
			{
				await _unitOfWork.RollbackTransactionAsync();
				throw;
			}
		}

		public async Task<bool> RequestPasswordResetAsync(ForgetPasswordDto input)
		{
			if (input == null)
			{
				throw new ArgumentException(_localizer["InputCannotBeNull"]);
			}
			var user = await _userRepository.FindByEmailAsync(input.Email);
			if (user == null)
			{
				throw new ValidationException(_localizer["UserNotFound"]);
			}
			await SendPasswordResetEmail(user);
			return true;
		}
		public async Task<bool> ResetPasswordAsync(Core.Dtos.AuthenticationDto.ResetPasswordDto input)
		{
			if (input == null)
				throw new ArgumentException(_localizer["InputCannotBeNull"]);

			if (input.NewPassword != input.ConfirmPassword)
				throw new ValidationException(_localizer["PasswordsDoNotMatch"]);

			var user = await _userRepository.FindByIdAsync(input.UserId);
			if (user == null)
				throw new ValidationException(_localizer["UserNotFound"]);
			var decodedTokenBytes = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(input.Token));
			var result = await _userRepository.ResetPasswordAsync(user, decodedTokenBytes, input.NewPassword);
			if (!result.Succeeded)
			{
				throw new ValidationException($"{_localizer["PasswordResetFailed"]}");
			}
			return true;
		}
		private async Task SendPasswordResetEmail(AppUser user)
		{
			var token = await _userRepository.GeneratePasswordResetTokenAsync(user);
			var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
			var resetLink = $"{_urlSettings.FrontendResetPassword}?userId={user.Id}&token={encodedToken}";
			var body = await _emailTemplateService.RenderAsync(
			 "/Views/Emails/ResetPassword.cshtml",
			 new Dtos.EmailDto.ResetPasswordDto
			 {
				 FullName = user.FullName,
				 ResetUrl = resetLink
			 });
			await _emailService.SendEmailAsync(new EmailDto
			{
				ToEmail = user.Email ?? string.Empty,
				Subject = "Yêu cầu đặt lại mật khẩu",
				HtmlBody = body
			});
		}
		private async Task SendConfirmationEmailAsync(AppUser user, string token)
		{
			var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
			var confirmUrl = $"{_urlSettings.BaseUrl}/api/Authentication/confirm-email?userId={user.Id}&token={encodedToken}";

			var body = await _emailTemplateService.RenderAsync(
					"/Views/Emails/ConfirmEmail.cshtml",
					new ConfirmEmailDto
					{
						FullName = user.FullName,
						ConfirmUrl = confirmUrl
					});

			await _emailService.SendEmailAsync(new EmailDto
			{
				ToEmail = user.Email ?? string.Empty,
				Subject = "Vui lòng xác nhận email của bạn",
				HtmlBody = body
			});
		}


	}
}
