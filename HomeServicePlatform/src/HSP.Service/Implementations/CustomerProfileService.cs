using HSP.Core.Dtos.CustomerProfileDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;
using System.Text;

namespace HSP.Service.Implementations
{
	public class CustomerProfileService : BaseService, ICustomerProfileService
	{
		private readonly IRepository<CustomerProfile, Guid> _customerProfileRepository;
		private readonly UserManager<AppUser> _userManager;
		private readonly IEmailService _emailService;
		private readonly IConfiguration _configuration;

		public CustomerProfileService(IRepository<CustomerProfile, Guid> customerProfileRepository,
			IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer,
			UserManager<AppUser> userManager, IEmailService emailService, IConfiguration configuration) : base(unitOfWork, localizer)
		{
			_customerProfileRepository = customerProfileRepository;
			_userManager = userManager;
			_emailService = emailService;
			_configuration = configuration;
		}

		public async Task<Guid> CreateCustomerProfileAsync(Guid userId)
		{
			if (userId == Guid.Empty)
			{
				throw new UnauthorizedAccessException("Người dùng chưa được xác thực.");
			}
			var customerProfile = new CustomerProfile
			{
				UserId = userId,
				DateCreated = DateTime.UtcNow
			};
			await _customerProfileRepository.AddAsync(customerProfile);
			await _unitOfWork.SaveChangesAsync();
			return customerProfile.Id;
		}

		public async Task<CustomerProfileDto> GetCustomerProfileByUserIdAsync(string userId)
		{
			// Debug: Log userId để kiểm tra
			Console.WriteLine($"[DEBUG] Searching for CustomerProfile with UserId: {userId}");

			var customerProfile = await _customerProfileRepository.GetAll()
				.Include(x => x.User)
				.Include(x => x.Homes)
				.Where(x => x.UserId.ToString().Equals(userId) && !x.IsDeleted)
				.Select(x => new CustomerProfileDto
				{
					Id = x.Id,
					UserId = x.UserId,
					FullName = x.User.FullName,
					Email = x.User.Email ?? string.Empty,
					PhoneNumber = x.User.PhoneNumber ?? string.Empty,
					DateCreated = x.DateCreated,
					DateModified = x.DateModified,
					TotalHomes = x.Homes.Count(h => !h.IsDeleted)
				}).FirstOrDefaultAsync();

			// Debug: Log kết quả
			Console.WriteLine($"[DEBUG] CustomerProfile found: {customerProfile != null}");

			if (customerProfile == null)
			{
				// Debug: Kiểm tra xem có profile nào trong database không
				var allProfiles = await _customerProfileRepository.GetAll()
					.Where(x => !x.IsDeleted)
					.Select(x => new { x.Id, x.UserId })
					.ToListAsync();
				Console.WriteLine($"[DEBUG] Total profiles in database: {allProfiles.Count}");
				foreach (var p in allProfiles)
				{
					Console.WriteLine($"[DEBUG] Profile ID: {p.Id}, UserId: {p.UserId}");
				}

				throw new KeyNotFoundException($"Customer profile not found for user ID: {userId}");
			}
			return customerProfile;
		}

		public async Task<CustomerProfileDto> GetCustomerProfileByIdAsync(Guid profileId)
		{
			var customerProfile = await _customerProfileRepository.GetAll()
				.Include(x => x.User)
				.Include(x => x.Homes)
				.Where(x => x.Id == profileId && !x.IsDeleted)
				.Select(x => new CustomerProfileDto
				{
					Id = x.Id,
					UserId = x.UserId,
					FullName = x.User.FullName,
					Email = x.User.Email ?? string.Empty,
					PhoneNumber = x.User.PhoneNumber ?? string.Empty,
					DateCreated = x.DateCreated,
					DateModified = x.DateModified,
					TotalHomes = x.Homes.Count(h => !h.IsDeleted)
				}).FirstOrDefaultAsync();
			if (customerProfile == null)
			{
				throw new KeyNotFoundException("Customer profile not found.");
			}
			return customerProfile;
		}

		public async Task<CustomerProfileDto> UpdateCustomerProfileAsync(string userId, UpdateCustomerProfileDto updateDto)
		{
			var customerProfile = await _customerProfileRepository.GetAll()
				.Include(x => x.User)
				.Where(x => x.UserId.ToString().Equals(userId) && !x.IsDeleted)
				.FirstOrDefaultAsync();

			if (customerProfile == null)
			{
				throw new KeyNotFoundException($"Customer profile not found for user ID: {userId}");
			}

			customerProfile.User.FullName = updateDto.FullName;
			customerProfile.User.PhoneNumber = updateDto.PhoneNumber;
			customerProfile.DateModified = DateTime.UtcNow;

			await _unitOfWork.SaveChangesAsync();

			return await GetCustomerProfileByUserIdAsync(userId);
		}

		public async Task<object> GetCustomersAsync(int pageNumber = 1, int pageSize = 10, string? searchTerm = null)
		{
			var query = _customerProfileRepository.GetAll()
				.Include(x => x.User)
				.Include(x => x.Homes)
				.Where(x => !x.IsDeleted);

			// Apply search filter if provided
			if (!string.IsNullOrEmpty(searchTerm))
			{
				query = query.Where(x =>
					x.User.FullName.Contains(searchTerm) ||
					(x.User.Email != null && x.User.Email.Contains(searchTerm)) ||
					(x.User.PhoneNumber != null && x.User.PhoneNumber.Contains(searchTerm)));
			}

			// Get total count for pagination
			var totalCount = await query.CountAsync();

			// Apply pagination
			var customers = await query
				.OrderByDescending(x => x.DateCreated)
				.Skip((pageNumber - 1) * pageSize)
				.Take(pageSize)
				.Select(x => new CustomerProfileDto
				{
					Id = x.Id,
					UserId = x.UserId,
					FullName = x.User.FullName,
					Email = x.User.Email ?? string.Empty,
					PhoneNumber = x.User.PhoneNumber ?? string.Empty,
					DateCreated = x.DateCreated,
					DateModified = x.DateModified,
					TotalHomes = x.Homes.Count(h => !h.IsDeleted)
				}).ToListAsync();

			return new
			{
				Data = customers,
				TotalCount = totalCount,
				PageNumber = pageNumber,
				PageSize = pageSize,
				TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
			};
		}

		public async Task<object> GetDebugInfoAsync()
		{
			try
			{
				var profiles = await _customerProfileRepository.GetAll()
					.Include(x => x.User)
					.Where(x => !x.IsDeleted)
					.Select(x => new
					{
						Id = x.Id,
						UserId = x.UserId,
						UserEmail = x.User != null ? x.User.Email : "N/A",
						UserName = x.User != null ? x.User.FullName : "N/A",
						DateCreated = x.DateCreated
					}).ToListAsync();

				return new
				{
					TotalProfiles = profiles.Count,
					Profiles = profiles
				};
			}
			catch (Exception ex)
			{
				return new
				{
					Error = ex.Message,
					TotalProfiles = 0,
					Profiles = new object[0]
				};
			}
		}

		public async Task<EmailChangeResponseDto> RequestEmailChangeAsync(string userId, string newEmail)
		{
			try
			{
				// Kiểm tra user có tồn tại không
				if (!Guid.TryParse(userId, out var userGuid))
				{
					return new EmailChangeResponseDto
					{
						Success = false,
						Message = "User ID không hợp lệ"
					};
				}

				var user = await _userManager.FindByIdAsync(userId);
				if (user == null)
				{
					return new EmailChangeResponseDto
					{
						Success = false,
						Message = "Không tìm thấy người dùng"
					};
				}

				// Kiểm tra email mới có trùng với email hiện tại không
				if (user.Email?.Equals(newEmail, StringComparison.OrdinalIgnoreCase) == true)
				{
					return new EmailChangeResponseDto
					{
						Success = false,
						Message = "Email mới không được trùng với email hiện tại"
					};
				}

				// Kiểm tra email mới có bị trùng với user khác không
				var existingUser = await _userManager.FindByEmailAsync(newEmail);
				if (existingUser != null)
				{
					return new EmailChangeResponseDto
					{
						Success = false,
						Message = "Email này đã được sử dụng bởi tài khoản khác"
					};
				}

				// Tạo token để xác thực email
				var token = await _userManager.GenerateChangeEmailTokenAsync(user, newEmail);

				// Tạo link xác thực
				var tokenBytes = Encoding.UTF8.GetBytes($"{userId}:{newEmail}:{token}");
				var base64Token = Convert.ToBase64String(tokenBytes);
				var baseUrl = _configuration["UrlSettings:FrontendEmailChange"];
				var confirmUrl = $"{baseUrl}?token={base64Token}";

				// Gửi email xác thực
				var emailDto = new EmailDto
				{
					ToEmail = newEmail,
					Subject = "Xác nhận thay đổi email",
					HtmlBody = $"""
						<h3>Xác nhận thay đổi email</h3>
						<p>Xin chào {user.FullName},</p>
						<p>Bạn đã yêu cầu thay đổi email từ <strong>{user.Email}</strong> sang <strong>{newEmail}</strong>.</p>
						<p>Vui lòng nhấp vào liên kết dưới đây để xác nhận thay đổi:</p>
						<p><a href="{confirmUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Xác nhận thay đổi email</a></p>
						<p>Nếu bạn không yêu cầu thay đổi này, vui lòng bỏ qua email này.</p>
						<p>Liên kết sẽ hết hạn sau 24 giờ.</p>
					""",
					TextBody = $"Xin chào {user.FullName},\nBạn đã yêu cầu thay đổi email từ {user.Email} sang {newEmail}.\nVui lòng truy cập liên kết sau để xác nhận: {confirmUrl}"
				};

				await _emailService.SendEmailAsync(emailDto);

				return new EmailChangeResponseDto
				{
					Success = true,
					Message = "Email xác thực đã được gửi đến địa chỉ email mới",
					NewEmail = newEmail
				};
			}
			catch (Exception ex)
			{
				return new EmailChangeResponseDto
				{
					Success = false,
					Message = $"Lỗi khi gửi email xác thực: {ex.Message}"
				};
			}
		}

		public async Task<EmailChangeResponseDto> ConfirmEmailChangeAsync(string userId, string token)
		{
			try
			{
				// Debug logging
				Console.WriteLine($"[DEBUG] ConfirmEmailChange - UserId: {userId}");
				Console.WriteLine($"[DEBUG] ConfirmEmailChange - Token: {token}");

				// Decode token
				var tokenBytes = Convert.FromBase64String(token);
				var tokenString = Encoding.UTF8.GetString(tokenBytes);
				var tokenParts = tokenString.Split(':');

				Console.WriteLine($"[DEBUG] ConfirmEmailChange - TokenString: {tokenString}");
				Console.WriteLine($"[DEBUG] ConfirmEmailChange - TokenParts Length: {tokenParts.Length}");

				if (tokenParts.Length != 3)
				{
					return new EmailChangeResponseDto
					{
						Success = false,
						Message = $"Token không hợp lệ - Expected 3 parts, got {tokenParts.Length}"
					};
				}

				var tokenUserId = tokenParts[0];
				var newEmail = tokenParts[1];
				var changeEmailToken = tokenParts[2];

				Console.WriteLine($"[DEBUG] ConfirmEmailChange - TokenUserId: {tokenUserId}");
				Console.WriteLine($"[DEBUG] ConfirmEmailChange - NewEmail: {newEmail}");
				Console.WriteLine($"[DEBUG] ConfirmEmailChange - ChangeEmailToken: {changeEmailToken}");

				// Kiểm tra userId có khớp không
				if (!tokenUserId.Equals(userId, StringComparison.OrdinalIgnoreCase))
				{
					return new EmailChangeResponseDto
					{
						Success = false,
						Message = $"Token không khớp với người dùng - Expected: {userId}, Got: {tokenUserId}"
					};
				}

				var user = await _userManager.FindByIdAsync(userId);
				if (user == null)
				{
					return new EmailChangeResponseDto
					{
						Success = false,
						Message = "Không tìm thấy người dùng"
					};
				}

				// Kiểm tra email mới có bị trùng không (trước khi thay đổi)
				var existingUser = await _userManager.FindByEmailAsync(newEmail);
				if (existingUser != null && existingUser.Id != user.Id)
				{
					return new EmailChangeResponseDto
					{
						Success = false,
						Message = "Email này đã được sử dụng bởi tài khoản khác"
					};
				}

				// Xác thực token và thay đổi email
				var result = await _userManager.ChangeEmailAsync(user, newEmail, changeEmailToken);
				if (!result.Succeeded)
				{
					var errors = string.Join(", ", result.Errors.Select(e => e.Description));
					return new EmailChangeResponseDto
					{
						Success = false,
						Message = $"Không thể thay đổi email: {errors}"
					};
				}

				// Cập nhật UserName nếu cần (thường UserName = Email)
				if (user.UserName == user.Email)
				{
					user.UserName = newEmail;
					await _userManager.UpdateAsync(user);
				}

				return new EmailChangeResponseDto
				{
					Success = true,
					Message = "Email đã được thay đổi thành công",
					NewEmail = newEmail
				};
			}
			catch (Exception ex)
			{
				return new EmailChangeResponseDto
				{
					Success = false,
					Message = $"Lỗi khi xác nhận thay đổi email: {ex.Message}"
				};
			}
		}
	}
}
