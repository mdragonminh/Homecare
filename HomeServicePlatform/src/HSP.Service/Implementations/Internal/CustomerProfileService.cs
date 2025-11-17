using HSP.Core.Dtos.AppUserDto;
using HSP.Core.Dtos.FileDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;
using System.Text;

namespace HSP.Service.Implementations.Internal
{
    public class CustomerProfileService : BaseService, ICustomerProfileService
    {
        private readonly RoleManager<AppRole> _roleManager;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly IRepository<Core.Entities.File, Guid> _fileRepository;
        private readonly IRepository<FileRelation, Guid> _fileRelationRepository;
        private readonly IRepository<ObjectType, Guid> _objectTypeRepository;
        private readonly IUserRepository _userRepository;

        public CustomerProfileService(
            IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer,
            RoleManager<AppRole> roleManager,
            IEmailService emailService, IConfiguration configuration,
            IRepository<Core.Entities.File, Guid> fileRepository,
            IRepository<FileRelation, Guid> fileRelationRepository,
            IRepository<ObjectType, Guid> objectTypeRepository, 
            IUserRepository userRepository) : base(unitOfWork, localizer)
        {
            _roleManager = roleManager;
            _emailService = emailService;
            _configuration = configuration;
            _fileRepository = fileRepository;
            _fileRelationRepository = fileRelationRepository;
            _objectTypeRepository = objectTypeRepository;
            _userRepository = userRepository;
        }

        public async Task<AppUserDto> GetCustomerByUserIdAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                throw new ArgumentException("Invalid user ID format");
            }

            var user = await _userRepository.GetUsersAsQueryable()
                .Include(x => x.Homes.Where(h => !h.IsDeleted))
                .Where(x => x.Id == userGuid && x.IsActive)
                .FirstOrDefaultAsync();

            if (user == null)
            {
                throw new KeyNotFoundException($"User not found for ID: {userId}");
            }

            // Lấy avatar URL
            var avatarUrl = await GetUserAvatarUrlAsync(user.Id);

            return new AppUserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                DateCreated = user.DateCreated,
                DateModified = user.DateModified,
                TotalHomes = user.Homes.Count,
                IsActive = user.IsActive,
                LastLoginAt = user.LastLoginAt,
                AvatarUrl = avatarUrl
            };
        }

        public async Task<AppUserDto> GetCustomerByIdAsync(Guid userId)
        {
            var user = await _userRepository.GetUsersAsQueryable() 
                .Include(x => x.Homes.Where(h => !h.IsDeleted))
                .Where(x => x.Id == userId && x.IsActive)
                .FirstOrDefaultAsync();

            if (user == null)
            {
                throw new KeyNotFoundException($"User not found for ID: {userId}");
            }

            // Lấy avatar URL
            var avatarUrl = await GetUserAvatarUrlAsync(user.Id);

            return new AppUserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                DateCreated = user.DateCreated,
                DateModified = user.DateModified,
                TotalHomes = user.Homes.Count,
                IsActive = user.IsActive,
                LastLoginAt = user.LastLoginAt,
                AvatarUrl = avatarUrl
            };
        }

        public async Task<AppUserDto> UpdateCustomerAsync(string userId, UpdateAppUserDto updateDto)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                throw new ArgumentException("Invalid user ID format");
            }

            var user = await _userRepository.FindByIdAsync(userGuid);
            if (user == null)
            {
                throw new KeyNotFoundException($"User not found for ID: {userId}");
            }



            user.FullName = updateDto.FullName;
            user.PhoneNumber = updateDto.PhoneNumber;
            user.DateModified = DateTime.UtcNow;

            var result = await _userRepository.UpdateAccount(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to update user: {errors}");
            }

            return await GetCustomerByUserIdAsync(userId);
        }

        public async Task<PagedList<AppUserDto>> GetCustomersAsync(int pageNumber = 1, int pageSize = 10, string? searchTerm = null)
        {
            // Lấy tất cả users có role Customer
            var customerRole = await _roleManager.FindByNameAsync("Customer");
            if (customerRole == null)
            {
                return new PagedList<AppUserDto>(new List<AppUserDto>(), 0, pageNumber, pageSize);
            }

            var query = _userRepository.GetUsersAsQueryable()
                .Include(x => x.Homes.Where(h => !h.IsDeleted))
                .Where(x => x.IsActive);

            // Apply search filter if provided
            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(x =>
                    x.FullName.Contains(searchTerm) ||
                    (x.Email != null && x.Email.Contains(searchTerm)) ||
                    (x.PhoneNumber != null && x.PhoneNumber.Contains(searchTerm)));
            }

            // Filter by Customer role
            var userIds = await _userRepository.GetUsersInRoleAsync("Customer");
            var customerUserIds = userIds.Select(u => u.Id).ToList();
            query = query.Where(x => customerUserIds.Contains(x.Id));

            var paginationParams = new PaginationParams
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                OrderBy = "DateCreated descending" 
            };

            var pagedUsers = await query.ToPagedListAsync(paginationParams);

            var customerDtos = new List<AppUserDto>();
            foreach (var user in pagedUsers.Items)
            {
                var avatarUrl = await GetUserAvatarUrlAsync(user.Id);
                customerDtos.Add(new AppUserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email ?? string.Empty,
                    PhoneNumber = user.PhoneNumber ?? string.Empty,
                    DateCreated = user.DateCreated,
                    DateModified = user.DateModified,
                    TotalHomes = user.Homes.Count,
                    IsActive = user.IsActive,
                    LastLoginAt = user.LastLoginAt,
                    AvatarUrl = avatarUrl
                });
            }

            return new PagedList<AppUserDto>(
            customerDtos,
            pagedUsers.TotalCount,
            pageNumber, 
            pageSize    
            );
        }

        public async Task<object> GetDebugInfoAsync()
        {
            try
            {
                var customerRole = await _roleManager.FindByNameAsync("Customer");
                if (customerRole == null)
                {
                    return new
                    {
                        Error = "Customer role not found",
                        TotalCustomers = 0,
                        Customers = new object[0]
                    };
                }

                var customers = await _userRepository.GetUsersInRoleAsync("Customer");
                var customersInfo = customers.Where(x => x.IsActive).Select(x => new
                {
                    Id = x.Id,
                    Email = x.Email,
                    FullName = x.FullName,
                    DateCreated = x.DateCreated,
                    IsActive = x.IsActive
                }).ToList();

                return new
                {
                    TotalCustomers = customersInfo.Count,
                    Customers = customersInfo
                };
            }
            catch (Exception ex)
            {
                return new
                {
                    Error = ex.Message,
                    TotalCustomers = 0,
                    Customers = new object[0]
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

                var user = await _userRepository.FindByIdAsync(userGuid);
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
                var existingUser = await _userRepository.FindByEmailAsync(newEmail);
                if (existingUser != null)
                {
                    return new EmailChangeResponseDto
                    {
                        Success = false,
                        Message = "Email này đã được sử dụng bởi tài khoản khác"
                    };
                }

                // Tạo token để xác thực email
                var token = await _userRepository.GenerateChangeEmailTokenAsync(user, newEmail);

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

                if (!Guid.TryParse(userId, out var userGuid))
                {
                    return new EmailChangeResponseDto
                    {
                        Success = false,
                        Message = "User ID không hợp lệ"
                    };
                }

                var user = await _userRepository.FindByIdAsync(userGuid);
                if (user == null)
                {
                    return new EmailChangeResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng"
                    };
                }

                // Kiểm tra email mới có bị trùng không (trước khi thay đổi)
                var existingUser = await _userRepository.FindByEmailAsync(newEmail);
                if (existingUser != null && existingUser.Id != user.Id)
                {
                    return new EmailChangeResponseDto
                    {
                        Success = false,
                        Message = "Email này đã được sử dụng bởi tài khoản khác"
                    };
                }

                // Xác thực token và thay đổi email
                var result = await _userRepository.ChangeEmailAsync(user, newEmail, changeEmailToken);
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
                    await _userRepository.UpdateAccount(user);
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

        private async Task<string?> GetUserAvatarUrlAsync(Guid userId)
        {
            // Lấy ObjectType cho User
            var userObjectType = await _objectTypeRepository.GetAll()
                .Where(x => x.Name == "User")
                .FirstOrDefaultAsync();

            if (userObjectType == null) return null;

            // Lấy avatar file relation
            var avatarRelation = await _fileRelationRepository.GetAll()
                .Include(x => x.File)
                .Where(x => x.ObjectId == userId &&
                           x.ObjectTypeId == userObjectType.Id &&
                           x.RelationType == "avatar" &&
                           !x.File.IsDeleted)
                .OrderByDescending(x => x.DateCreated)
                .FirstOrDefaultAsync();

            return avatarRelation?.File.FilePath;
        }

        //public async Task<AvatarUploadResponseDto> UploadAvatarAsync(string userId, FileUploadRequest fileRequest)
        //{
        //    try
        //    {
        //        if (!Guid.TryParse(userId, out var userGuid))
        //        {
        //            return new AvatarUploadResponseDto
        //            {
        //                Success = false,
        //                Message = "User ID không hợp lệ"
        //            };
        //        }

        //        var user = await _userManager.FindByIdAsync(userId);
        //        if (user == null)
        //        {
        //            return new AvatarUploadResponseDto
        //            {
        //                Success = false,
        //                Message = "Không tìm thấy người dùng"
        //            };
        //        }


        //        // Lấy hoặc tạo ObjectType cho User
        //        var userObjectType = await _objectTypeRepository.GetAll()
        //            .Where(x => x.Name == "User")
        //            .FirstOrDefaultAsync();

        //        if (userObjectType == null)
        //        {
        //            userObjectType = new ObjectType
        //            {
        //                Id = Guid.NewGuid(),
        //                Name = "User",
        //                Description = "User object type for file attachments"
        //            };
        //            await _objectTypeRepository.AddAsync(userObjectType);
        //        }

        //        // Xóa avatar cũ (soft delete)
        //        var oldAvatarRelations = await _fileRelationRepository.GetAll()
        //            .Include(x => x.File)
        //            .Where(x => x.ObjectId == userGuid &&
        //                       x.ObjectTypeId == userObjectType.Id &&
        //                       x.RelationType == "avatar" &&
        //                       !x.File.IsDeleted)
        //            .ToListAsync();

        //        foreach (var oldRelation in oldAvatarRelations)
        //        {
        //            oldRelation.File.IsDeleted = true;
        //            oldRelation.File.DateModified = DateTime.UtcNow;
        //            _fileRepository.Update(oldRelation.File);
        //        }

        //        // Tạo file mới
        //        var newFile = new HSP.Core.Entities.File
        //        {
        //            Id = Guid.NewGuid(),
        //            FileName = fileRequest.FileName,
        //            FilePath = fileRequest.FilePath,
        //            FileType = fileRequest.FileType,
        //            FileSize = fileRequest.FileSize,
        //            UploadedBy = fileRequest.UploadedBy,
        //            DateCreated = DateTime.UtcNow,
        //            DateModified = DateTime.UtcNow,
        //            IsDeleted = false
        //        };

        //        await _fileRepository.AddAsync(newFile);

        //        // Tạo file relation
        //        var fileRelation = new FileRelation
        //        {
        //            Id = Guid.NewGuid(),
        //            FileId = newFile.Id,
        //            ObjectTypeId = userObjectType.Id,
        //            ObjectId = userGuid,
        //            RelationType = "avatar",
        //            DateCreated = DateTime.UtcNow,
        //            DateModified = DateTime.UtcNow
        //        };

        //        await _fileRelationRepository.AddAsync(fileRelation);
        //        await _unitOfWork.SaveChangesAsync();

        //        return new AvatarUploadResponseDto
        //        {
        //            Success = true,
        //            Message = "Avatar đã được upload thành công",
        //            File = new FileResponseDto
        //            {
        //                Id = newFile.Id,
        //                FileName = newFile.FileName,
        //                FilePath = newFile.FilePath,
        //                FileType = newFile.FileType,
        //                FileSize = newFile.FileSize,
        //                RelationType = "avatar",
        //                DateCreated = newFile.DateCreated
        //            },
        //            AvatarUrl = newFile.FilePath
        //        };
        //    }
        //    catch (Exception ex)
        //    {
        //        return new AvatarUploadResponseDto
        //        {
        //            Success = false,
        //            Message = $"Lỗi khi upload avatar: {ex.Message}"
        //        };
        //    }
        //}

        //public async Task<AvatarUploadResponseDto> DeleteAvatarAsync(string userId)
        //{
        //    try
        //    {
        //        if (!Guid.TryParse(userId, out var userGuid))
        //        {
        //            return new AvatarUploadResponseDto
        //            {
        //                Success = false,
        //                Message = "User ID không hợp lệ"
        //            };
        //        }

        //        var user = await _userManager.FindByIdAsync(userId);
        //        if (user == null)
        //        {
        //            return new AvatarUploadResponseDto
        //            {
        //                Success = false,
        //                Message = "Không tìm thấy người dùng"
        //            };
        //        }


        //        // Lấy ObjectType cho User
        //        var userObjectType = await _objectTypeRepository.GetAll()
        //            .Where(x => x.Name == "User")
        //            .FirstOrDefaultAsync();

        //        if (userObjectType == null)
        //        {
        //            return new AvatarUploadResponseDto
        //            {
        //                Success = false,
        //                Message = "Không tìm thấy avatar để xóa"
        //            };
        //        }

        //        // Tìm và xóa avatar hiện tại (soft delete)
        //        var avatarRelations = await _fileRelationRepository.GetAll()
        //            .Include(x => x.File)
        //            .Where(x => x.ObjectId == userGuid &&
        //                       x.ObjectTypeId == userObjectType.Id &&
        //                       x.RelationType == "avatar" &&
        //                       !x.File.IsDeleted)
        //            .ToListAsync();

        //        if (!avatarRelations.Any())
        //        {
        //            return new AvatarUploadResponseDto
        //            {
        //                Success = false,
        //                Message = "Không tìm thấy avatar để xóa"
        //            };
        //        }

        //        foreach (var relation in avatarRelations)
        //        {
        //            relation.File.IsDeleted = true;
        //            relation.File.DateModified = DateTime.UtcNow;
        //            _fileRepository.Update(relation.File);
        //        }

        //        await _unitOfWork.SaveChangesAsync();

        //        return new AvatarUploadResponseDto
        //        {
        //            Success = true,
        //            Message = "Avatar đã được xóa thành công"
        //        };
        //    }
        //    catch (Exception ex)
        //    {
        //        return new AvatarUploadResponseDto
        //        {
        //            Success = false,
        //            Message = $"Lỗi khi xóa avatar: {ex.Message}"
        //        };
        //    }
        //}
    }
}
