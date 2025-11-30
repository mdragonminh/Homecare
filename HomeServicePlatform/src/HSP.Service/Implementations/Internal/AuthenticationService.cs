using HSP.Core.Constans;
using HSP.Core.Constants;
using HSP.Core.Dtos.AccountDto;
using HSP.Core.Dtos.AuthenticationDto;
using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Dtos.FileDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Dtos.AuthenticationDto;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Interfaces;
using ImageMagick;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;

namespace HSP.Service.Implementations.Internal
{
    public class AuthenticationService : BaseService, IAuthenticationService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;
        private readonly IAuthSignInService _signInService;
        private readonly UrlSettingsDto _urlSettings;
        private readonly IJwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly IEmailTemplateService _emailTemplateService;
        private readonly IRepository<Core.Entities.Service, Guid> _serviceRepository;
        private readonly IFileService _fileService;
        private readonly IOcrService _ocrService;
        private readonly IChatbotService _chatbotService;
        public AuthenticationService(IUserRepository userRepository,
            IOptions<UrlSettingsDto> urlOptions,
            IRepository<TechnicianProfile, Guid> technicianRepository,
            IAuthSignInService signInService,
            IJwtService jwtService,
            IEmailService emailService,
            IEmailTemplateService emailTemplateService,
            IRepository<Core.Entities.Service, Guid> serviceRepository,
            IFileService fileService,
            IOcrService ocrService,
            IChatbotService chatbotService,
            IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
        {
            _userRepository = userRepository;
            _urlSettings = urlOptions.Value;
            _technicianRepository = technicianRepository;
            _signInService = signInService;
            _jwtService = jwtService;
            _emailService = emailService;
            _emailTemplateService = emailTemplateService;
            _serviceRepository = serviceRepository;
            _fileService = fileService;
            _ocrService = ocrService;
            _chatbotService = chatbotService;
        }

        public async Task<ConfirmEmailResultDto> ConfirmEmail(Guid userId, string token)
        {
            var user = await _userRepository.FindByIdAsync(userId);
            if (user == null)
            {
                return new ConfirmEmailResultDto { Success = false, Error = "UserNotFound", Message = _localizer["UserNotFound"] };
            }
            var result = await _userRepository.ConfirmEmailAsync(user, token);
            if (result.Succeeded)
            {
                return new ConfirmEmailResultDto { Success = true, Message = _localizer["ConfirmEmail_Success"] };
            }
            if (result.Errors.Any(e => e.Code.Contains("InvalidToken")))
            {
                return new ConfirmEmailResultDto { Success = false, Error = "InvalidToken", Message = _localizer["ConfirmEmail_InvalidToken"] };
            }

            if (result.Errors.Any(e => e.Code.Contains("TokenExpired")))
            {
                return new ConfirmEmailResultDto { Success = false, Error = "TokenExpired", Message = _localizer["ConfirmEmail_TokenExpired"] };
            }

            return new ConfirmEmailResultDto { Success = false, Error = "UnknownError", Message = _localizer["ConfirmEmail_Failed"] };
        }

        public async Task<LoginResponseDto> Login(LoginRequestDto input)
        {
            if (input == null)
            {
                throw new ArgumentNullException(_localizer["InputCannotBeNull"]);
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
                throw new ValidationException(_localizer["InvalidEmailOrPhone"]);
            }
            if (!user.IsActive)
            {
                throw new UnauthorizedAccessException(_localizer["AccountInactive"]);
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
            
            // Update LastLoginAt
            user.LastLoginAt = DateTime.Now;
            await _userRepository.UpdateAccount(user);
            await _unitOfWork.SaveChangesAsync();
            
            var token = await _jwtService.GenerateTokenPairAsync(new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName ?? string.Empty
            });
            return new LoginResponseDto
            {
                JwtToken = token,
                RequirePasswordSetup = string.IsNullOrEmpty(user.PasswordHash),
                MustChangePasswordOnLogin = user.MustChangePasswordOnLogin
            };
        }
        public async Task<LoginResponseDto> GoogleLogin()
        {
            var info = await _signInService.GetExternalLoginInfoAsync();
            if (info == null)
            {
                throw new InvalidOperationException(_localizer["ErrorLoadingGoogleLogin"]);
            }

            var user = await FindOrCreateUserAsync(info);
            if (user == null)
            {
                throw new Exception(_localizer["CannotFindOrCreateUser"]);
            }
            if (!user.IsActive)
            {
                throw new UnauthorizedAccessException(_localizer["AccountInactive"]);
            }

            // Update LastLoginAt
            user.LastLoginAt = DateTime.Now;
            await _userRepository.UpdateAccount(user);
            await _unitOfWork.SaveChangesAsync();

            var token = await _jwtService.GenerateTokenPairAsync(new UserDto
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
                var emailRegex = new Regex(@"^[\w\.\-+]+@([\w\-]+\.)+[\w\-]{2,}$");
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

            if (user.MustChangePasswordOnLogin)
            {
                user.MustChangePasswordOnLogin = false;
                await _unitOfWork.SaveChangesAsync();
            }

            return new ChangePasswordResponseDto
            {
                Message = _localizer["PasswordChangeSuccess"]
            };
        }

        public async Task<RegisterResponseDto> Register(RegisterRequestDto input)
        {
            if (input == null)
                throw new ArgumentNullException(_localizer["InputCannotBeNull"]);
            if (!IsValidEmail(input.Email))
                throw new ValidationException(_localizer["InvalidEmailFormat"]);
            if (input.Password != input.ConfirmPassword)
                throw new ValidationException(_localizer["PasswordsDoNotMatch"]);

            var existing = await _userRepository.FindByEmailAsync(input.Email);
            if (existing != null)
                return await HandleExistingUserAsync(existing);

            var user = await CreateUserAsync(input.Email, input.FullName, input.PhoneNumber, input.Password);
            return await AssignRoleAndSendConfirmationAsync(user, RoleNames.Customer);
        }

        public async Task<RegisterResponseDto> RegisterTechnician(RegisterTechnicianRequestDto input)
        {
            if (input == null)
                throw new ArgumentNullException(_localizer["InputCannotBeNull"]);
            if (!IsValidEmail(input.Email))
                throw new ValidationException(_localizer["InvalidEmailFormat"]);
            if (input.Password != input.ConfirmPassword)
                throw new ValidationException(_localizer["PasswordsDoNotMatch"]);

            var existing = await _userRepository.FindByEmailAsync(input.Email);
            if (existing != null)
                return await HandleExistingUserAsync(existing);

            using (var transaction = await _unitOfWork.BeginTransactionAsync())
            {
                try
                {
                    var user = await CreateUserAsync(input.Email, input.FullName, input.PhoneNumber, input.Password);
                    var technicianProfile = new TechnicianProfile
                    {
                        UserId = user.Id,
                        ExperienceYears = input.ExperienceYears,
                        Address = input.Address,
                        CitizenId = input.CitizenId,
                        DateCreated = DateTime.UtcNow,
                        IsDeleted = false
                    };
                    if (input.ServiceIds != null && input.ServiceIds.Any())
                    {
                        var services = await _serviceRepository.GetAll()
                            .Where(x => input.ServiceIds.Contains(x.Id))
                            .ToListAsync();
                        foreach (var service in services)
                            technicianProfile.Services.Add(service);
                    }
                    await _technicianRepository.AddAsync(technicianProfile);
                    await _unitOfWork.SaveChangesAsync();
                    await HandleTechnicianFilesAsync(technicianProfile, input);
                    var resp = await AssignRoleAndSendConfirmationAsync(user, RoleNames.Technician);
                    await transaction.CommitAsync();
                    return resp;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
        }
        private async Task<AppUser> CreateUserAsync(string email, string fullName, string phone, string password)
        {
            var user = new AppUser
            {
                Email = email,
                UserName = email,
                FullName = fullName,
                PhoneNumber = phone,
                EmailConfirmed = false
            };

            var result = await _userRepository.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                throw new ValidationException(_localizer["UserCreationFailed"]);
            }

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
        private async Task<RegisterResponseDto> AssignRoleAndSendConfirmationAsync(AppUser user, string role)
        {
            var roleResult = await _userRepository.AddToRoleAsync(user, role);
            if (!roleResult.Succeeded)
            {
                throw new ValidationException(_localizer["AddToRoleFailed"]);
            }

            var token = await _userRepository.GenerateEmailConfirmationTokenAsync(user);
            await SendConfirmationEmailAsync(user, token);

            return new RegisterResponseDto
            {
                UserId = user.Id,
                Email = user.Email,
                EmailConfirmToken = token
            };
        }
        private async Task HandleTechnicianFilesAsync(TechnicianProfile profile, RegisterTechnicianRequestDto input)
        {
            await ProcessAvatarAsync(profile, input.AvatarFile);
            await ProcessLegalDocumentAsync(profile, input.LegalDocument);
            await ProcessCertificatesAsync(profile, input.CertificateFiles);
        }
        private async Task ProcessAvatarAsync(TechnicianProfile profile, IFormFile? avatar)
        {
            if (avatar == null)
                return;

            await _fileService.UploadAsync(new FileUploadDto
            {
                UserId = profile.UserId,
                File = avatar,
                ObjectId = profile.Id,
                ObjectTypeName = RoleNames.Technician,
                RelationType = FileConstants.Avatar
            });
        }
        private async Task ProcessLegalDocumentAsync(TechnicianProfile profile, IFormFile? legalDocument)
        {
            if (legalDocument == null)
                return;

            if (string.IsNullOrWhiteSpace(profile.CitizenId))
                throw new ValidationException(_localizer["CitizenIdRequired"]);

            var images = await ConvertPdfToImagesIfNeeded(legalDocument);

            bool isValid = false;

            foreach (var imgBytes in images)
            {
                var ocrText = await _ocrService.ExtractTextAsync(imgBytes);

                bool legal = await _chatbotService.ValidateLegalDocumentAsync(ocrText);
                bool containsId = ContainsCitizenId(ocrText, profile.CitizenId);

                if (legal && containsId)
                {
                    isValid = true;
                    break;
                }
            }

            if (!isValid)
                throw new ValidationException(_localizer["LegalDocumentInvalid"]);

            await _fileService.UploadAsync(new FileUploadDto
            {
                UserId = profile.UserId,
                File = legalDocument,
                ObjectId = profile.Id,
                ObjectTypeName = RoleNames.Technician,
                RelationType = FileConstants.LegalDocument
            });
        }
        private async Task ProcessCertificatesAsync(TechnicianProfile profile,
            IEnumerable<IFormFile>? certFiles)
        {
            if (certFiles == null || !certFiles.Any())
                return;

            var selectedServices = profile.Services.ToList();
            var serviceNames = selectedServices.Select(s => s.Name).ToList();

            foreach (var certFile in certFiles)
            {
                var images = await ConvertPdfToImagesIfNeeded(certFile);
                bool matched = false;

                foreach (var imgBytes in images)
                {
                    var ocrText = await _ocrService.ExtractTextAsync(imgBytes);

                    if (await _chatbotService.ValidateCertificateAsync(ocrText, serviceNames))
                    {
                        matched = true;
                        break;
                    }
                }

                if (!matched)
                    throw new ValidationException(_localizer["CertificateMismatch", string.Join(", ", serviceNames)]);
            }

            var uploadDtos = certFiles.Select(certFile => new FileUploadDto
            {
                UserId = profile.UserId,
                File = certFile,
                ObjectId = profile.Id,
                ObjectTypeName = RoleNames.Technician,
                RelationType = FileConstants.TechnicianCertificate
            });

            await _fileService.UploadManyAsync(uploadDtos);
        }
        private bool ContainsCitizenId(string ocrText, string citizenId)
        {
            var normalizedId = new string(citizenId.Where(char.IsDigit).ToArray());
            if (string.IsNullOrWhiteSpace(normalizedId))
                return false;

            if (ocrText.Contains(normalizedId))
                return true;

            var pattern = string.Join(@"\D*", normalizedId.Select(c => c.ToString()));

            if (Regex.IsMatch(ocrText, pattern))
                return true;

            foreach (Match m in Regex.Matches(ocrText, @"\d{6,20}"))
            {
                var found = new string(m.Value.Where(char.IsDigit).ToArray());
                if (found == normalizedId)
                    return true;
            }

            return false;
        }
        private async Task<List<byte[]>> ConvertPdfToImagesIfNeeded(IFormFile file)
        {
            var result = new List<byte[]>();
            var bytes = await GetBytesAsync(file);

            if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            {
                result.Add(bytes);
                return result;
            }

            var settings = new MagickReadSettings
            {
                Density = new Density(300)
            };

            using (var images = new MagickImageCollection())
            {
                images.Read(bytes, settings);

                foreach (var img in images)
                {
                    img.Format = MagickFormat.Png;

                    using (var ms = new MemoryStream())
                    {
                        img.Write(ms);
                        result.Add(ms.ToArray());
                    }
                }
            }

            return result;
        }
        private async Task<byte[]> GetBytesAsync(IFormFile certFile)
        {
            using var ms = new MemoryStream();
            await certFile.CopyToAsync(ms);
            return ms.ToArray();
        }

        public async Task<bool> AddPasswordAsync(Guid userId, AddPasswordDto input)
        {
            if (userId == Guid.Empty || input == null)
            {
                throw new ArgumentNullException(_localizer["InputCannotBeNull"]);
            }
            if (input.NewPassword != input.ConfirmPassword)
            {
                throw new ValidationException(_localizer["PasswordsDoNotMatch"]);
            }
            var user = await _userRepository.FindByIdAsync(userId);
            if (user == null) throw new ValidationException(_localizer["UserNotFound"]);
            if (!string.IsNullOrEmpty(user.PasswordHash))
            {
                throw new ValidationException(_localizer["UserAlreadyHasPassword"]);
            }
            var result = await _userRepository.AddPasswordAsync(user, input.NewPassword);
            if (!result.Succeeded) throw new Exception(_localizer["AddPasswordFailed"]);
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
