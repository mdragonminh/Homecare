using HSP.Core.Constans;
using HSP.Core.Entities;
using HSP.Core.Interfaces;
using HSP.Service.Dtos.AuthenticationDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading;

namespace HSP.Service.Implementations
{
	public class AuthenticationService : BaseService, IAuthenticationService
	{
		private readonly IUserRepository _userRepository;
		private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;
		private readonly IRepository<CustomerProfile, Guid> _customerProfileRepository;
		private readonly SignInManager<AppUser> _signInManager;
		private readonly IConfiguration _configuration;

		public AuthenticationService(IUserRepository userRepository, IConfiguration configuration,
			IRepository<TechnicianProfile, Guid> technicianRepository,
			IRepository<CustomerProfile, Guid> customerProfileRepository,
			IUnitOfWork unitOfWork,
			SignInManager<AppUser> signInManager) : base(unitOfWork)
		{
			_userRepository = userRepository;
			_configuration = configuration;
			_technicianRepository = technicianRepository;
			_signInManager = signInManager;
			_customerProfileRepository = customerProfileRepository;
		}

		public async Task<bool> ConfirmEmail(Guid userId, string token)
		{
			var user = await _userRepository.FindByIdAsync(userId);
			if (user == null) return false;
			var result = await _userRepository.ConfirmEmailAsync(user, token);
			return true;
		}

		public async Task<LoginResponseDto> Login(LoginRequestDto input)
		{
			if (input == null)
			{
				throw new ArgumentException("Input cannot be null");
			}
			var user = await _userRepository.FindByEmailAsync(input.Email);
			if (user == null)
			{
				throw new ValidationException("Invalid email or password");
			}
			bool passwordValid = await _userRepository.CheckPasswordAsync(user, input.Password);
			if (!passwordValid)
			{
				throw new UnauthorizedAccessException("Invalid password.");
			}
			var token = await GenerateJwtToken(user);
			return new LoginResponseDto
			{
				JwtToken = token,
			};
		}
		public async Task<LoginResponseDto> GoogleLogin()
		{
			var info = await _signInManager.GetExternalLoginInfoAsync();
			if (info == null)
			{
				throw new Exception("Lỗi tải thông tin đăng nhập từ Google.");
			}

			var user = await FindOrCreateUserAsync(info);
			if (user == null)
			{
				throw new Exception("Không thể tìm hoặc tạo người dùng.");
			}

			var token = await GenerateJwtToken(user);
			return new LoginResponseDto
			{
				JwtToken = token
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
				throw new Exception("Không tìm thấy email từ nhà cung cấp dịch vụ.");
			}

			user = await _userRepository.FindByEmailAsync(email);

			if (user == null)
			{
				user = await CreateNewUserAsync(info, email);
			}

			var addLoginResult = await _userRepository.AddLoginAsync(user, info);
			if (!addLoginResult.Succeeded)
			{
				throw new Exception("Liên kết tài khoản Google thất bại.");
			}
			return user;
		}
		private async Task<AppUser> CreateNewUserAsync(ExternalLoginInfo info, string email)
		{
			var user = new AppUser
			{
				UserName = email,
				Email = email,
				FullName = info.Principal.FindFirstValue(ClaimTypes.Name),
				EmailConfirmed = true
			};

			using var transaction = await _unitOfWork.BeginTransactionAsync();
			try
			{
				var createResult = await _userRepository.CreateAsync(user);
				if (!createResult.Succeeded)
				{
					throw new Exception("Tạo người dùng thất bại.");
				}

				var roleResult = await _userRepository.AddToRoleAsync(user, RoleNames.Customer);
				if (!roleResult.Succeeded)
				{
					throw new Exception("Gán vai trò cho người dùng thất bại.");
				}

				var customerProfile = new CustomerProfile
				{
					UserId = user.Id,
					DateCreated = DateTime.UtcNow
				};
				await _customerProfileRepository.AddAsync(customerProfile);
				await _unitOfWork.SaveChangesAsync();

				await transaction.CommitAsync();
				return user;
			}
			catch (Exception)
			{
				await transaction.RollbackAsync();
				throw;
			}
		}
		private async Task<string> GenerateJwtToken(AppUser user)
		{
			var roles = await _userRepository.GetRolesAsync(user);
			var claims = new List<Claim>
			{
						new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
						new Claim(ClaimTypes.Email, user.Email),
						new Claim(ClaimTypes.Name, user.FullName),
				};
			foreach (var role in roles)
			{
				claims.Add(new Claim(ClaimTypes.Role, role));
			}
			var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]));
			var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var token = new JwtSecurityToken(
					issuer: _configuration["JwtSettings:Issuer"],
					audience: _configuration["JwtSettings:Audience"],
					claims: claims,
					expires: DateTime.UtcNow.AddHours(1),
					signingCredentials: creds
			);

			return new JwtSecurityTokenHandler().WriteToken(token);
		}

		public async Task<RegisterResponseDto> Register(RegisterRequestDto input)
		{
			return await RegisterInternalAsync(input, role: RoleNames.Customer);
		}
		public async Task<RegisterResponseDto> RegisterTechnician(RegisterTechnicianRequestDto input)
		{
			return await RegisterInternalAsync(input, input.SkillSet, input.ExperienceYears, phoneNumber: input.PhoneNumber, role: RoleNames.Technician);
		}
		private async Task<RegisterResponseDto> RegisterInternalAsync(RegisterRequestDto input,
			string? skillSet = null, int? experienceYears = null,
			string? phoneNumber = null, string? role = null)
		{
			if (input == null)
				throw new ArgumentException("Input cannot be null");

			if (input.Password != input.ConfirmPassword)
				throw new ValidationException("Password and Confirm Password do not match");
			await _unitOfWork.BeginTransactionAsync();
			try
			{
				var user = new AppUser
				{
					Email = input.Email,
					UserName = input.Email,
					FullName = input.FullName,
					EmailConfirmed = false,
					PhoneNumber = phoneNumber
				};

				var created = await _userRepository.CreateAsync(user, input.Password);
				if (!created.Succeeded)
					throw new Exception("User creation failed");

				if (!string.IsNullOrEmpty(role))
					await _userRepository.AddToRoleAsync(user, role);

				if (role == RoleNames.Technician)
				{
					var profile = new TechnicianProfile
					{
						UserId = user.Id,
						SkillSet = skillSet ?? string.Empty,
						ExperienceYears = experienceYears ?? 0
					};
					await _technicianRepository.AddAsync(profile);
				}

				await _unitOfWork.SaveChangesAsync();

				var token = await _userRepository.GenerateEmailConfirmationTokenAsync(user);

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
	}
}
