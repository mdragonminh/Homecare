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
using HSP.Service.Implementations;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using MockQueryable;
using Moq;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text;

namespace HSP.Service.Test.Implementations
{
    public class AuthenticationServiceTests
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<IRepository<TechnicianProfile, Guid>> _mockTechnicianProfileRepository;
        private readonly Mock<IAuthSignInService> _mockAuthSignInService;
        private readonly Mock<IOptions<UrlSettingsDto>> _mockUrlOptions;
        private readonly Mock<IJwtService> _mockJwtService;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IEmailTemplateService> _mockEmailTemplateService;
        private readonly Mock<IRepository<Core.Entities.Service, Guid>> _mockServiceRepository;
        private readonly Mock<IFileService> _mockFileService;
        private readonly Mock<IOcrService> _mockOcrService;
        private readonly Mock<IChatbotService> _mockChatbotService;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;
        private readonly AuthenticationService _authenticationService;

        public AuthenticationServiceTests()
        {
            _mockUserRepository = new Mock<IUserRepository>();
            _mockTechnicianProfileRepository = new Mock<IRepository<TechnicianProfile, Guid>>();
            _mockJwtService = new Mock<IJwtService>();
            _mockEmailService = new Mock<IEmailService>();
            _mockEmailTemplateService = new Mock<IEmailTemplateService>();
            _mockServiceRepository = new Mock<IRepository<Core.Entities.Service, Guid>>();
            _mockFileService = new Mock<IFileService>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();
            _mockUrlOptions = new Mock<IOptions<UrlSettingsDto>>();
            _mockUrlOptions.Setup(x => x.Value).Returns(new UrlSettingsDto
            {
                BaseUrl = "https://localhost:7190",
                FrontendLoginSuccess = "http://localhost:5173/google-callback",
                FrontendLoginFailed = "http://localhost:5173/login"
            });
            _mockOcrService = new Mock<IOcrService>();
            _mockChatbotService = new Mock<IChatbotService>();
            _mockAuthSignInService = new Mock<IAuthSignInService>();
            _authenticationService = new AuthenticationService(
                _mockUserRepository.Object,
                _mockUrlOptions.Object,
                _mockTechnicianProfileRepository.Object,
                _mockAuthSignInService.Object,
                _mockJwtService.Object,
                _mockEmailService.Object,
                _mockEmailTemplateService.Object,
                _mockServiceRepository.Object,
                _mockFileService.Object,
                _mockOcrService.Object,
                _mockChatbotService.Object,
                _mockUnitOfWork.Object,
                _mockLocalizer.Object
            );
        }
        [Fact]
        public async Task Register_ValidInput_ReturnsRegisterResponseDto()
        {
            var input = new RegisterRequestDto
            {
                Email = "quanhqhe173484@fpt.edu.vn",
                FullName = "Hoàng Quốc Quân",
                PhoneNumber = "0888777222",
                Password = "123Qwe@@",
                ConfirmPassword = "123Qwe@@"
            };

            var createdUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = input.Email,
                UserName = input.Email,
                FullName = input.FullName,
                PhoneNumber = input.PhoneNumber,
                EmailConfirmed = false
            };
            _mockUserRepository
             .Setup(x => x.FindByEmailAsync(input.Email))
             .ReturnsAsync((AppUser?)null);
            _mockUserRepository
                .Setup(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password))
                .ReturnsAsync(IdentityResult.Success);

            _mockUserRepository
                    .Setup(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Customer))
                    .ReturnsAsync(IdentityResult.Success);

            _mockUserRepository
                    .Setup(x => x.GenerateEmailConfirmationTokenAsync(It.IsAny<AppUser>()))
                    .ReturnsAsync("test_token");
            _mockEmailTemplateService
                .Setup(x => x.RenderAsync(
                        "/Views/Emails/ConfirmEmail.cshtml",
                        It.IsAny<ConfirmEmailDto>()))
                .ReturnsAsync("<html>Email body</html>");

            _mockEmailService
                    .Setup(x => x.SendEmailAsync(It.IsAny<EmailDto>()))
                    .Returns(Task.CompletedTask);

            var result = await _authenticationService.Register(input);

            Assert.NotNull(result);
            Assert.Equal(input.Email, result.Email);
            Assert.False(string.IsNullOrEmpty(result.EmailConfirmToken));
            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password), Times.Once);
            _mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Customer), Times.Once);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Once);
        }
        [Fact]
        public async Task Register_WithNullArgument_ThrowsArgumentNullException()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() => _authenticationService.Register(null!));
            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
            _mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Customer), Times.Never);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
        }
        [Fact]
        public async Task Register_WhenPasswordAndConfirmPasswordNotMatch_ThrowValidationException()
        {
            var input = new RegisterRequestDto
            {
                Email = "quanhqhe173484@fpt.edu.vn",
                FullName = "Hoàng Quốc Quân",
                PhoneNumber = "0888777222",
                Password = "123Qwe@@",
                ConfirmPassword = "123Qwe!!"
            };
            await Assert.ThrowsAsync<ValidationException>(() => _authenticationService.Register(input));
            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
            _mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Customer), Times.Never);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
        }
        [Fact]
        public async Task Register_WhenEmailAlreadyExistsWithEmailConfirmed_ThrowsException()
        {
            string ExistingEmail = "quan@gmail.com";
            _mockUserRepository
             .Setup(x => x.FindByEmailAsync(ExistingEmail))
             .ReturnsAsync(new AppUser
             {
                 Id = Guid.NewGuid(),
                 Email = "quan@gmail.com",
                 UserName = "quan@gmail.com",
                 FullName = "fullName",
                 PhoneNumber = "0888777222",
                 EmailConfirmed = true
             });
            var input = new RegisterRequestDto
            {
                Email = "quan@gmail.com",
                FullName = "fullName",
                PhoneNumber = "0888777222",
                Password = "123Qwe@@",
                ConfirmPassword = "123Qwe@@"
            };
            await Assert.ThrowsAsync<ValidationException>(() => _authenticationService.Register(input));
            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password), Times.Never);
            _mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Customer), Times.Never);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
        }
        [Fact]
        public async Task Register_WhenEmailAlreadyExistsWithEmailNotConfirmed_ReturnsNewTokenAndSendsEmail()
        {
            string ExistingEmail = "quanhoang@gmail.com";
            _mockUserRepository
             .Setup(x => x.FindByEmailAsync(ExistingEmail))
             .ReturnsAsync(new AppUser
             {
                 Id = Guid.NewGuid(),
                 Email = "quanhoang@gmail.com",
                 UserName = "quanhoang@gmail.com",
                 FullName = "Hoàng Quốc Quân",
                 PhoneNumber = "0888777222",
                 EmailConfirmed = false
             });
            var input = new RegisterRequestDto
            {
                Email = "quanhoang@gmail.com",
                FullName = "Hoàng Quốc Quân",
                PhoneNumber = "0888777222",
                Password = "123Qwe@@",
                ConfirmPassword = "123Qwe@@"
            };
            _mockUserRepository
                    .Setup(x => x.GenerateEmailConfirmationTokenAsync(It.IsAny<AppUser>()))
                    .ReturnsAsync("test_token");
            _mockEmailTemplateService.Setup(x => x.RenderAsync(
                        "/Views/Emails/ConfirmEmail.cshtml",
                        It.IsAny<ConfirmEmailDto>()))
                .ReturnsAsync("<html>Email body</html>");
            _mockEmailService
                    .Setup(x => x.SendEmailAsync(It.IsAny<EmailDto>()))
                    .Returns(Task.CompletedTask);
            var result = await _authenticationService.Register(input);

            Assert.NotNull(result);
            Assert.Equal(input.Email, result.Email);
            Assert.False(string.IsNullOrEmpty(result.EmailConfirmToken));
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Once);
            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password), Times.Never);
            _mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Customer), Times.Never);
        }
        [Fact]
        public async Task Register_WhenCreateUserFails_ThrowsValidationException()
        {
            var input = new RegisterRequestDto
            {
                Email = "email@gmail.com",
                FullName = "fullName",
                PhoneNumber = "0888777222",
                Password = "Password123!",
                ConfirmPassword = "Password123!"
            };

            var createdUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = input.Email,
                UserName = input.Email,
                FullName = input.FullName,
                PhoneNumber = input.PhoneNumber,
                EmailConfirmed = false
            };
            _mockUserRepository
             .Setup(x => x.FindByEmailAsync(input.Email))
             .ReturnsAsync((AppUser?)null);
            _mockUserRepository
                .Setup(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError
                {
                    Description = "User creation failed"
                }));
            await Assert.ThrowsAsync<ValidationException>(() => _authenticationService.Register(input));
            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password), Times.Once);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
            _mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Customer), Times.Never);
        }
        [Fact]
        public async Task Register_WhenAddToRoleFails_ThrowsValidationException()
        {
            var input = new RegisterRequestDto
            {
                Email = "email@gmail.com",
                FullName = "fullName",
                PhoneNumber = "0888777222",
                Password = "Password123!",
                ConfirmPassword = "Password123!"
            };
            var createdUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = input.Email,
                UserName = input.Email,
                FullName = input.FullName,
                PhoneNumber = input.PhoneNumber,
                EmailConfirmed = false
            };
            _mockUserRepository
                 .Setup(x => x.FindByEmailAsync(input.Email))
                 .ReturnsAsync((AppUser?)null);

            _mockUserRepository
                .Setup(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password))
                .ReturnsAsync(IdentityResult.Success);

            _mockUserRepository
                    .Setup(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Customer))
                    .ReturnsAsync(IdentityResult.Failed(new IdentityError
                    {
                        Description = "Add to role failed"
                    }));

            await Assert.ThrowsAsync<ValidationException>(() => _authenticationService.Register(input));

            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password), Times.Once);
            _mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Customer), Times.Once);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
        }
        [Fact]
        public async Task RegisterTechnician_ValidInput_ReturnsRegisterResponseDto()
        {
            var input = new RegisterTechnicianRequestDto
            {
                Email = "email@gmail.com",
                FullName = "fullName",
                PhoneNumber = "0888777222",
                Password = "123Qwe@@",
                ConfirmPassword = "123Qwe@@",
                ExperienceYears = 5,
                ServiceIds = new List<Guid>
                {
                    Guid.NewGuid(),
                    Guid.NewGuid()
                },
                CitizenId = "033322228765",
                Address = "Hà Nội",
                AvatarFile = CreateMockFormFile("avatar.jpg"),
                LegalDocument = CreateMockFormFile("legal.jpg"),
                CertificateFiles = new List<IFormFile>
                {
                    CreateMockFormFile("cert.jpg")
                }
            };

            var createdUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = input.Email,
                UserName = input.Email,
                FullName = input.FullName,
                PhoneNumber = input.PhoneNumber,
                EmailConfirmed = false
            };
            var services = new List<Core.Entities.Service>
            {
                new() { Id = input.ServiceIds[0], Name = "Service A" },
                new() { Id = input.ServiceIds[1], Name = "Service B" }
            };
            var mockTransaction = new Mock<IDbContextTransaction>();
            mockTransaction.Setup(x => x.CommitAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
            mockTransaction.Setup(x => x.RollbackAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
            _mockUserRepository
             .Setup(x => x.FindByEmailAsync(input.Email))
             .ReturnsAsync((AppUser?)null);
            _mockUserRepository
                .Setup(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password))
                .ReturnsAsync(IdentityResult.Success);

            _mockUserRepository
                    .Setup(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Technician))
                    .ReturnsAsync(IdentityResult.Success);

            _mockUserRepository
                    .Setup(x => x.GenerateEmailConfirmationTokenAsync(It.IsAny<AppUser>()))
                    .ReturnsAsync("test_token");
            _mockEmailTemplateService
                .Setup(x => x.RenderAsync(
                        "/Views/Emails/ConfirmEmail.cshtml",
                        It.IsAny<ConfirmEmailDto>()))
                .ReturnsAsync("<html>Email body</html>");

            _mockEmailService
                    .Setup(x => x.SendEmailAsync(It.IsAny<EmailDto>()))
                    .Returns(Task.CompletedTask);

            _mockUnitOfWork.Setup(x => x.BeginTransactionAsync())
                .ReturnsAsync(mockTransaction.Object);
            var mockServices = services.BuildMock();
            _mockServiceRepository.Setup(x => x.GetAll())
                    .Returns(mockServices);

            _mockTechnicianProfileRepository.Setup(x => x.AddAsync(It.IsAny<TechnicianProfile>()))
                    .ReturnsAsync(new TechnicianProfile());

            _mockUnitOfWork.Setup(x => x.SaveChangesAsync())
                    .ReturnsAsync(1);
            _mockFileService
                    .Setup(x => x.UploadAsync(It.IsAny<FileUploadDto>()))
                    .ReturnsAsync(new FileDto
                    {
                        Id = Guid.NewGuid(),
                        FileName = "avatar.jpg",
                        FilePath = "uploads/avatar.jpg",
                        FileType = "image/jpeg",
                        FileSize = 1024
                    });
            _mockFileService
             .Setup(x => x.UploadManyAsync(It.Is<IEnumerable<FileUploadDto>>(
                     f => f.All(x => x.RelationType == FileConstants.TechnicianCertificate))))
             .ReturnsAsync(new List<FileDto>
             {
                        new()
                        {
                                Id = Guid.NewGuid(),
                                FileName = "cert1.jpg",
                                FilePath = "uploads/cert1.jpg",
                                FileType = "image/jpeg",
                                FileSize = 4567
                        },
                        new()
                        {
                                Id = Guid.NewGuid(),
                                FileName = "cert2.jpg",
                                FilePath = "uploads/cert2.jpg",
                                FileType = "image/jpeg",
                                FileSize = 7890
                        }
             });
            _mockOcrService
                .Setup(x => x.ExtractTextAsync(It.IsAny<byte[]>()))
                .ReturnsAsync("Legal doc contains ID 033322228765 and certificate for Service A");
            _mockChatbotService
                .Setup(x => x.ValidateLegalDocumentAsync(It.IsAny<string>()))
                .ReturnsAsync(true);
            _mockChatbotService
                .Setup(x => x.ValidateCertificateAsync(It.IsAny<string>(), It.IsAny<List<string>>()))
                .ReturnsAsync(true);

            var result = await _authenticationService.RegisterTechnician(input);

            Assert.NotNull(result);
            Assert.Equal(input.Email, result.Email);
            Assert.False(string.IsNullOrEmpty(result.EmailConfirmToken));

            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password), Times.Once);
            _mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Technician), Times.Once);
            _mockTechnicianProfileRepository.Verify(x => x.AddAsync(It.IsAny<TechnicianProfile>()), Times.Once);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Once);
            _mockFileService.Verify(x => x.UploadAsync(It.IsAny<FileUploadDto>()), Times.Exactly(2));
            _mockFileService.Verify(x => x.UploadManyAsync(It.IsAny<IEnumerable<FileUploadDto>>()), Times.Once);
        }
        private IFormFile CreateMockFormFile(string filename)
        {
            var content = "fake content";
            var bytes = Encoding.UTF8.GetBytes(content);
            var stream = new MemoryStream(bytes);

            var file = new Mock<IFormFile>();
            file.Setup(f => f.FileName).Returns(filename);
            file.Setup(f => f.Length).Returns(bytes.Length);
            file.Setup(f => f.OpenReadStream()).Returns(stream);
            file.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
                .Returns<Stream, CancellationToken>((s, _) => stream.CopyToAsync(s));

            return file.Object;
        }

        [Fact]
        public async Task RegisterTechnician_WithNullArgument_ThrowsArgumentNullException()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() => _authenticationService.RegisterTechnician(null!));
            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
            _mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Technician), Times.Never);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
            _mockTechnicianProfileRepository.Verify(x => x.AddAsync(It.IsAny<TechnicianProfile>()), Times.Never);
            _mockFileService.Verify(x => x.UploadAsync(It.IsAny<FileUploadDto>()), Times.Never);
            _mockFileService.Verify(x => x.UploadManyAsync(It.IsAny<IEnumerable<FileUploadDto>>()), Times.Never);
        }
        [Fact]
        public async Task RegisterTechnician_WhenPasswordAndConfirmPasswordNotMatch_ThrowValidationException()
        {
            var input = new RegisterTechnicianRequestDto
            {
                Email = "email@gmail.com",
                FullName = "fullName",
                PhoneNumber = "0888777222",
                Password = "Password123!",
                ConfirmPassword = "Password123@",
                ExperienceYears = 5,
                ServiceIds = new List<Guid>
                {
                    Guid.NewGuid(),
                    Guid.NewGuid()
                },
                Address = "Hà Nội",
                AvatarFile = Mock.Of<IFormFile>(),
                CertificateFiles = new List<IFormFile> { Mock.Of<IFormFile>() }
            };
            await Assert.ThrowsAsync<ValidationException>(() => _authenticationService.RegisterTechnician(input));
            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
            _mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Technician), Times.Never);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
            _mockTechnicianProfileRepository.Verify(x => x.AddAsync(It.IsAny<TechnicianProfile>()), Times.Never);
            _mockFileService.Verify(x => x.UploadAsync(It.IsAny<FileUploadDto>()), Times.Never);
            _mockFileService.Verify(x => x.UploadManyAsync(It.IsAny<IEnumerable<FileUploadDto>>()), Times.Never);
        }
        [Fact]
        public async Task RegisterTechnician_WhenExceptionOccurs_RollsBackTransaction()
        {
            var input = new RegisterTechnicianRequestDto
            {
                Email = "error@gmail.com",
                FullName = "Error User",
                PhoneNumber = "0999888777",
                Password = "Password123!",
                ConfirmPassword = "Password123!",
                ExperienceYears = 3,
                ServiceIds = new List<Guid> { Guid.NewGuid() },
                Address = "Hà Nội"
            };

            var mockTransaction = new Mock<IDbContextTransaction>();
            mockTransaction.Setup(x => x.CommitAsync(It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);
            mockTransaction.Setup(x => x.RollbackAsync(It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask)
                    .Verifiable();

            _mockUnitOfWork.Setup(x => x.BeginTransactionAsync())
                    .ReturnsAsync(mockTransaction.Object);

            _mockUserRepository.Setup(x => x.CreateAsync(It.IsAny<AppUser>(), It.IsAny<string>()))
                    .ThrowsAsync(new Exception("Simulated failure"));

            await Assert.ThrowsAsync<Exception>(() => _authenticationService.RegisterTechnician(input));

            mockTransaction.Verify(x => x.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
            mockTransaction.Verify(x => x.CommitAsync(It.IsAny<CancellationToken>()), Times.Never);
        }
        [Fact]
        public async Task RegisterTechnician_WhenExistingUserNotConfirmed_ReturnsToken()
        {
            var existing = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "email@gmail.com",
                EmailConfirmed = false
            };

            _mockUserRepository.Setup(x => x.FindByEmailAsync(existing.Email))
                .ReturnsAsync(existing);

            _mockUserRepository.Setup(x => x.GenerateEmailConfirmationTokenAsync(existing))
                .ReturnsAsync("regen_token");

            var result = await _authenticationService.RegisterTechnician(
                new RegisterTechnicianRequestDto { Email = existing.Email, Password = "aA1@", ConfirmPassword = "aA1@" });

            Assert.Equal(existing.Email, result.Email);
            Assert.Equal("regen_token", result.EmailConfirmToken);
        }
        [Fact]
        public async Task RegisterTechnician_WhenExistingUserConfirmed_ThrowsValidationException()
        {
            var existing = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "email@gmail.com",
                EmailConfirmed = true
            };

            _mockUserRepository.Setup(x => x.FindByEmailAsync(existing.Email))
                .ReturnsAsync(existing);

            await Assert.ThrowsAsync<ValidationException>(() =>
                _authenticationService.RegisterTechnician(
                    new RegisterTechnicianRequestDto
                    { Email = existing.Email, Password = "aA1@", ConfirmPassword = "aA1@" }));
        }
        [Fact]
        public async Task RegisterTechnician_WhenUserCreationFails_ThrowsValidationException()
        {
            var input = new RegisterTechnicianRequestDto
            {
                Email = "test@gmail.com",
                FullName = "A",
                PhoneNumber = "000",
                Password = "aA1@",
                ConfirmPassword = "aA1@",
                ServiceIds = new List<Guid> { Guid.NewGuid() }
            };

            _mockUserRepository.Setup(x => x.FindByEmailAsync(input.Email))
                .ReturnsAsync((AppUser)null);
            _mockUserRepository.Setup(x => x.CreateAsync(It.IsAny<AppUser>(), It.IsAny<string>()))
                .ReturnsAsync(IdentityResult.Failed());
            _mockUnitOfWork.Setup(x => x.BeginTransactionAsync())
                .ReturnsAsync(Mock.Of<IDbContextTransaction>());
            _mockServiceRepository.Setup(x => x.GetAll())
                .Returns(new List<Core.Entities.Service>().BuildMock());
            _mockUserRepository.Setup(x => x.GenerateEmailConfirmationTokenAsync(It.IsAny<AppUser>()))
                .ReturnsAsync("token");

            await Assert.ThrowsAsync<ValidationException>(() =>
                _authenticationService.RegisterTechnician(input));
        }
        [Fact]
        public async Task RegisterTechnician_WhenAddToRoleFails_ThrowsValidationException()
        {
            var input = new RegisterTechnicianRequestDto
            {
                Email = "test@gmail.com",
                FullName = "A",
                PhoneNumber = "000",
                Password = "aA1@",
                ConfirmPassword = "aA1@",
                ServiceIds = new List<Guid> { Guid.NewGuid() }
            };

            _mockUserRepository.Setup(x => x.CreateAsync(It.IsAny<AppUser>(), It.IsAny<string>()))
                .ReturnsAsync(IdentityResult.Success);
            _mockUserRepository.Setup(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Technician))
                .ReturnsAsync(IdentityResult.Failed());
            _mockUserRepository.Setup(x => x.FindByEmailAsync(input.Email))
                .ReturnsAsync((AppUser)null);
            _mockUnitOfWork.Setup(x => x.BeginTransactionAsync())
                .ReturnsAsync(Mock.Of<IDbContextTransaction>());
            _mockServiceRepository.Setup(x => x.GetAll())
                .Returns(new List<Core.Entities.Service>().BuildMock());
            _mockUserRepository.Setup(x => x.GenerateEmailConfirmationTokenAsync(It.IsAny<AppUser>()))
                .ReturnsAsync("token");

            await Assert.ThrowsAsync<ValidationException>(() =>
                _authenticationService.RegisterTechnician(input));
        }
        [Fact]
        public async Task ConfirmEmail_SuccessfulConfirmation_ReturnConfirmEmailResultDto()
        {
            var userId = Guid.NewGuid();
            var token = "valid_token";
            var existingUser = new AppUser
            {
                Id = userId,
                Email = "exmaple@gmail.com"
            };
            _mockUserRepository
                .Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(existingUser);
            _mockUserRepository.Setup(x => x.ConfirmEmailAsync(existingUser, token))
                .ReturnsAsync(IdentityResult.Success);
            var result = await _authenticationService.ConfirmEmail(userId, token);
            Assert.NotNull(result);
            Assert.IsType<ConfirmEmailResultDto>(result);
            Assert.True(result.Success);
            Assert.Equal("Email confirmed", result.Message);
            Assert.Null(result.Error);
            _mockUserRepository.Verify(x => x.FindByIdAsync(userId), Times.Once);
            _mockUserRepository.Verify(x => x.ConfirmEmailAsync(It.IsAny<AppUser>(), token), Times.Once);
        }
        [Fact]
        public async Task ConfirmEmail_UserNotFound_ReturnConfirmEmailResultDto()
        {
            var userId = Guid.NewGuid();
            var token = "invalid_token";
            _mockUserRepository
                .Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync((AppUser?)null);
            var result = await _authenticationService.ConfirmEmail(userId, token);
            Assert.NotNull(result);
            Assert.IsType<ConfirmEmailResultDto>(result);
            Assert.False(result.Success);
            Assert.Equal("UserNotFound", result.Error);
            Assert.Equal("User not found", result.Message);
            _mockUserRepository.Verify(x => x.FindByIdAsync(userId), Times.Once);
            _mockUserRepository.Verify(x => x.ConfirmEmailAsync(It.IsAny<AppUser>(), token), Times.Never);
        }
        [Fact]
        public async Task ConfirmEmail_TokenExpired_ReturnConfirmEmailResultDto()
        {
            var userId = Guid.NewGuid();
            var token = "expired_token";
            var existingUser = new AppUser
            {
                Id = userId,
                Email = "example@gmail.com",
                EmailConfirmed = false
            };
            _mockUserRepository
                .Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(existingUser);
            _mockUserRepository.Setup(x => x.ConfirmEmailAsync(existingUser, token))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError
                {
                    Code = "TokenExpired",
                    Description = "The token is invalid or has expired."
                }));
            var result = await _authenticationService.ConfirmEmail(userId, token);
            Assert.NotNull(result);
            Assert.IsType<ConfirmEmailResultDto>(result);
            Assert.False(result.Success);
            Assert.Equal("TokenExpired", result.Error);
            Assert.Equal("Token expired", result.Message);
            _mockUserRepository.Verify(x => x.FindByIdAsync(userId), Times.Once);
            _mockUserRepository.Verify(x => x.ConfirmEmailAsync(It.IsAny<AppUser>(), token), Times.Once);
        }
        [Fact]
        public async Task ConfirmEmail_TokenInvalid_ReturnConfirmEmailResultDto()
        {
            var userId = Guid.NewGuid();
            var token = "invalid_token";
            var existingUser = new AppUser
            {
                Id = userId,
                Email = "example@gmail.com",
                EmailConfirmed = false
            };
            _mockUserRepository
                .Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(existingUser);
            _mockUserRepository.Setup(x => x.ConfirmEmailAsync(existingUser, token))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError
                {
                    Code = "InvalidToken",
                    Description = "The token is invalid"
                }));
            var result = await _authenticationService.ConfirmEmail(userId, token);
            Assert.NotNull(result);
            Assert.IsType<ConfirmEmailResultDto>(result);
            Assert.False(result.Success);
            Assert.Equal("InvalidToken", result.Error);
            Assert.Equal("Invalid token", result.Message);
            _mockUserRepository.Verify(x => x.FindByIdAsync(userId), Times.Once);
            _mockUserRepository.Verify(x => x.ConfirmEmailAsync(It.IsAny<AppUser>(), token), Times.Once);
        }
        [Fact]
        public async Task ConfirmEmail_UnknownError_ReturnConfirmEmailResultDto()
        {
            var userId = Guid.NewGuid();
            var token = "some_token";
            var existingUser = new AppUser
            {
                Id = userId,
                Email = "example@gmail.com",
                EmailConfirmed = false
            };
            var identityError = new IdentityError
            {
                Code = "SomeOtherError",
                Description = "Unexpected failure in confirmation"
            };
            _mockUserRepository
                    .Setup(x => x.FindByIdAsync(userId))
                    .ReturnsAsync(existingUser);
            _mockUserRepository
                    .Setup(x => x.ConfirmEmailAsync(existingUser, token))
                    .ReturnsAsync(IdentityResult.Failed(identityError));

            var result = await _authenticationService.ConfirmEmail(userId, token);

            Assert.NotNull(result);
            Assert.IsType<ConfirmEmailResultDto>(result);
            Assert.False(result.Success);
            Assert.Equal("UnknownError", result.Error);
            Assert.Equal("Email confirmation failed", result.Message);
            _mockUserRepository.Verify(x => x.FindByIdAsync(userId), Times.Once);
            _mockUserRepository.Verify(x => x.ConfirmEmailAsync(existingUser, token), Times.Once);
        }
        [Fact]
        public async Task Login_ValidInputFindByEmail_ReturnLoginResponseDto()
        {
            var input = new LoginRequestDto
            {
                EmailOrPhone = "quanhqhe173484@fpt.edu.vn",
                Password = "123Qwe@@"
            };
            var existingUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = input.EmailOrPhone,
                UserName = input.EmailOrPhone,
                FullName = "Hoàng Quốc Quân",
                PhoneNumber = "0888777222",
                EmailConfirmed = true,
                IsActive = true
            };
            _mockUserRepository
                .Setup(x => x.FindByEmailAsync(input.EmailOrPhone))
                .ReturnsAsync(existingUser);
            _mockUserRepository.Setup(x => x.CheckPasswordAsync(existingUser, input.Password))
                .ReturnsAsync(true);
            _mockJwtService.Setup(x => x.GenerateTokenPairAsync(It.IsAny<Core.Dtos.AccountDto.UserDto>()))
                .ReturnsAsync(new TokenResponseDto
                {
                    AccessToken = "access",
                    RefreshToken = "refresh",
                    AccessTokenExpiresAt = DateTime.UtcNow.AddHours(1),
                    RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7)
                });
            var result = await _authenticationService.Login(input);
            Assert.NotNull(result);
            Assert.NotNull(result.JwtToken);
        }
        [Fact]
        public async Task Login_ValidInputFindByPhoneNumber_ReturnLoginResponseDto()
        {
            var input = new LoginRequestDto
            {
                EmailOrPhone = "0888777222",
                Password = "123Qwe@@"
            };
            var existingUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "example@gmail.com",
                UserName = "example@gmail.com",
                FullName = "Example User",
                PhoneNumber = input.EmailOrPhone,
                EmailConfirmed = true,
                IsActive = true
            };
            _mockUserRepository
                .Setup(x => x.FindByPhoneNumberAsync(input.EmailOrPhone))
                .ReturnsAsync(existingUser);
            _mockUserRepository.Setup(x => x.CheckPasswordAsync(existingUser, input.Password))
                .ReturnsAsync(true);
            _mockJwtService.Setup(x => x.GenerateTokenPairAsync(It.IsAny<Core.Dtos.AccountDto.UserDto>()))
                .ReturnsAsync(new TokenResponseDto
                {
                    AccessToken = "access",
                    RefreshToken = "refresh",
                    AccessTokenExpiresAt = DateTime.UtcNow.AddHours(1),
                    RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7)
                });
            var result = await _authenticationService.Login(input);
            Assert.NotNull(result);
            Assert.NotNull(result.JwtToken);
        }
        [Fact]
        public async Task Login_NullArgumentInput_ThrowArgumentNullException()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() => _authenticationService.Login(null!));
            _mockUserRepository.Verify(x => x.FindByEmailAsync(It.IsAny<string>()), Times.Never);
            _mockUserRepository.Verify(x => x.FindByPhoneNumberAsync(It.IsAny<string>()), Times.Never);
            _mockUserRepository.Verify(x => x.CheckPasswordAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
            _mockJwtService.Verify(x => x.GenerateTokenPairAsync(It.IsAny<Core.Dtos.AccountDto.UserDto>()), Times.Never);
        }
        [Fact]
        public async Task Login_UserNotFound_ThrowValidationException()
        {
            var input = new LoginRequestDto
            {
                EmailOrPhone = "example@gmail.com",
                Password = "123Qwe@@"
            };
            var existingUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = input.EmailOrPhone,
                UserName = input.EmailOrPhone,
                FullName = "Example User",
                PhoneNumber = "0888777222",
                EmailConfirmed = true,
                IsActive = true
            };
            _mockUserRepository
                .Setup(x => x.FindByEmailAsync(input.EmailOrPhone))
                .ReturnsAsync((AppUser?)null);
            var result = await Assert.ThrowsAsync<ValidationException>(() => _authenticationService.Login(input));
            _mockUserRepository.Verify(x => x.FindByEmailAsync(input.EmailOrPhone), Times.Once);
            _mockUserRepository.Verify(x => x.CheckPasswordAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
            _mockJwtService.Verify(x => x.GenerateTokenPairAsync(It.IsAny<Core.Dtos.AccountDto.UserDto>()), Times.Never);
        }
        [Fact]
        public async Task Login_EmailNotConfirm_ThrowUnauthorizedAccessException()
        {
            var input = new LoginRequestDto
            {
                EmailOrPhone = "example1@gmail.com",
                Password = "123Qwe@@"
            };
            var existingUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = input.EmailOrPhone,
                UserName = input.EmailOrPhone,
                FullName = "Example User",
                PhoneNumber = "0888777222",
                EmailConfirmed = false,
                IsActive = true
            };
            _mockUserRepository
                .Setup(x => x.FindByEmailAsync(input.EmailOrPhone))
                .ReturnsAsync(existingUser);
            var result = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authenticationService.Login(input));
            _mockUserRepository.Verify(x => x.FindByEmailAsync(input.EmailOrPhone), Times.Once);
            _mockUserRepository.Verify(x => x.CheckPasswordAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
            _mockJwtService.Verify(x => x.GenerateTokenPairAsync(It.IsAny<Core.Dtos.AccountDto.UserDto>()), Times.Never);
        }
        [Fact]
        public async Task Login_IncorrectPassword_ThrowUnauthorizedAccessException()
        {
            var input = new LoginRequestDto
            {
                EmailOrPhone = "quanhqhe173484@fpt.edu.vn",
                Password = "123Qwe!!"
            };
            var existingUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = input.EmailOrPhone,
                UserName = input.EmailOrPhone,
                FullName = "Example User",
                PhoneNumber = "0888777222",
                EmailConfirmed = true,
                IsActive = true,
                PasswordHash = "hashed_password"
            };
            _mockUserRepository
                .Setup(x => x.FindByEmailAsync(input.EmailOrPhone))
                .ReturnsAsync(existingUser);
            _mockUserRepository.Setup(x => x.CheckPasswordAsync(existingUser, input.Password))
                .ReturnsAsync(false);
            var result = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _authenticationService.Login(input));
            _mockUserRepository.Verify(x => x.FindByEmailAsync(input.EmailOrPhone), Times.Once);
            _mockUserRepository.Verify(x => x.CheckPasswordAsync(existingUser, input.Password), Times.Once);
            _mockJwtService.Verify(x => x.GenerateTokenPairAsync(It.IsAny<Core.Dtos.AccountDto.UserDto>()), Times.Never);
        }
        [Fact]
        public async Task GoogleLogin_ExistingUSer_ReturnLoginResponseDto()
        {
            var email = "example@gmail.com";
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                UserName = email,
                FullName = "Example User",
                PhoneNumber = "0888777222",
                EmailConfirmed = true,
                IsActive = true
            };
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Name, "Example User")
            };
            var principle = new ClaimsPrincipal(new ClaimsIdentity(claims, "Google"));
            var externalInfo = new ExternalLoginInfo(principle, "Google", "google_id", "Google")
            {
                Principal = principle
            };
            _mockAuthSignInService.Setup(x => x.GetExternalLoginInfoAsync())
                .ReturnsAsync(externalInfo);
            _mockUserRepository.Setup(x => x.FindByLoginAsync("Google", "google_id"))
                .ReturnsAsync(user);
            _mockJwtService.Setup(x => x.GenerateTokenPairAsync(It.IsAny<UserDto>()))
                .ReturnsAsync(new TokenResponseDto
                {
                    AccessToken = "access",
                    RefreshToken = "refresh",
                    AccessTokenExpiresAt = DateTime.UtcNow.AddHours(1),
                    RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(7)
                });
            var result = await _authenticationService.GoogleLogin();
            Assert.NotNull(result);
            Assert.IsType<LoginResponseDto>(result);
            Assert.NotNull(result.JwtToken);
            Assert.Equal("access", result.JwtToken.AccessToken);
            Assert.Equal("refresh", result.JwtToken.RefreshToken);
            _mockAuthSignInService.Verify(x => x.GetExternalLoginInfoAsync(), Times.Once);
            _mockUserRepository.Verify(x => x.FindByLoginAsync("Google", "google_id"), Times.Once);
            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>()), Times.Never);
            _mockUserRepository.Verify(x => x.AddLoginAsync(It.IsAny<AppUser>(), It.IsAny<ExternalLoginInfo>()), Times.Never);
        }
        [Fact]
        public async Task GoogleLogin_LoginInfoIsNull_ThrowsInvalidOperationException()
        {
            _mockAuthSignInService.Setup(x => x.GetExternalLoginInfoAsync())
                .ReturnsAsync((ExternalLoginInfo?)null);
            await Assert.ThrowsAsync<InvalidOperationException>(() => _authenticationService.GoogleLogin());
            _mockAuthSignInService.Verify(x => x.GetExternalLoginInfoAsync(), Times.Once);
            _mockUserRepository.Verify(x => x.FindByLoginAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>()), Times.Never);
            _mockUserRepository.Verify(x => x.AddLoginAsync(It.IsAny<AppUser>(), It.IsAny<ExternalLoginInfo>()), Times.Never);
        }
        [Fact]
        public async Task GoogleLogin_CannotFindOrCreateUser_ThrowsException()
        {
            var email = "cannotcreate@gmail.com";
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Name, "Cannot Create")
            };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "Google"));
            var externalInfo = new ExternalLoginInfo(principal, "Google", "google_cannotcreate", "Google");
            _mockAuthSignInService.Setup(x => x.GetExternalLoginInfoAsync())
                    .ReturnsAsync(externalInfo);
            _mockUserRepository.Setup(x => x.FindByLoginAsync("Google", "google_cannotcreate"))
                    .ReturnsAsync((AppUser?)null);
            _mockUserRepository.Setup(x => x.FindByEmailAsync(email))
                    .ReturnsAsync((AppUser?)null);
            _mockUserRepository.Setup(x => x.CreateAsync(It.IsAny<AppUser>()))
                    .ReturnsAsync(IdentityResult.Failed(new IdentityError { Code = "UserCreationFailed" }));

            await Assert.ThrowsAsync<Exception>(() => _authenticationService.GoogleLogin());
            _mockAuthSignInService.Verify(x => x.GetExternalLoginInfoAsync(), Times.Once);
            _mockUserRepository.Verify(x => x.FindByLoginAsync("Google", "google_cannotcreate"), Times.Once);
        }

        [Fact]
        public async Task GoogleLogin_NewUserCreated_ReturnLoginResponseDto()
        {
            var email = "newuser@gmail.com";
            var claims = new List<Claim>
        {
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Name, "New User")
        };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "Google"));
            var externalInfo = new ExternalLoginInfo(principal, "Google", "google_999", "Google");

            var newUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                FullName = "New User",
                EmailConfirmed = true
            };

            _mockAuthSignInService.Setup(x => x.GetExternalLoginInfoAsync())
                    .ReturnsAsync(externalInfo);

            _mockUserRepository.Setup(x => x.FindByLoginAsync("Google", "google_999"))
                    .ReturnsAsync((AppUser?)null);

            _mockUserRepository.Setup(x => x.FindByEmailAsync(email))
                    .ReturnsAsync((AppUser?)null);

            _mockUserRepository.Setup(x => x.CreateAsync(It.IsAny<AppUser>()))
                    .ReturnsAsync(IdentityResult.Success);

            _mockUserRepository.Setup(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Customer))
                    .ReturnsAsync(IdentityResult.Success);

            _mockUserRepository.Setup(x => x.AddLoginAsync(It.IsAny<AppUser>(), externalInfo))
                    .ReturnsAsync(IdentityResult.Success);

            _mockJwtService.Setup(x => x.GenerateTokenPairAsync(It.IsAny<UserDto>()))
                    .ReturnsAsync(new TokenResponseDto
                    {
                        AccessToken = "access_new",
                        RefreshToken = "refresh_new"
                    });

            var result = await _authenticationService.GoogleLogin();

            Assert.NotNull(result);
            Assert.IsType<LoginResponseDto>(result);
            Assert.Equal("access_new", result.JwtToken.AccessToken);
            Assert.Equal("refresh_new", result.JwtToken.RefreshToken);

            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>()), Times.Once);
            _mockUserRepository.Verify(x => x.AddLoginAsync(It.IsAny<AppUser>(), externalInfo), Times.Once);
        }
        [Fact]
        public async Task GoogleLogin_EmailNotFoundFromProvider_ThrowsException()
        {
            var principal = new ClaimsPrincipal(new ClaimsIdentity(new List<Claim>(), "Google"));
            var externalInfo = new ExternalLoginInfo(principal, "Google", "google_id", "Google");

            _mockAuthSignInService.Setup(x => x.GetExternalLoginInfoAsync())
                    .ReturnsAsync(externalInfo);

            _mockUserRepository.Setup(x => x.FindByLoginAsync("Google", "google_id"))
                    .ReturnsAsync((AppUser?)null);

            await Assert.ThrowsAsync<Exception>(() => _authenticationService.GoogleLogin());
        }
        [Fact]
        public async Task GoogleLogin_AddLoginFails_ThrowsException()
        {
            var email = "failuser@gmail.com";
            var claims = new List<Claim>
        {
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Name, "Fail User")
        };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "Google"));
            var externalInfo = new ExternalLoginInfo(principal, "Google", "google_id_fail", "Google");

            var user = new AppUser { Id = Guid.NewGuid(), Email = email, FullName = "Fail User" };

            _mockAuthSignInService.Setup(x => x.GetExternalLoginInfoAsync())
                    .ReturnsAsync(externalInfo);

            _mockUserRepository.Setup(x => x.FindByLoginAsync("Google", "google_id_fail"))
                    .ReturnsAsync((AppUser?)null);

            _mockUserRepository.Setup(x => x.FindByEmailAsync(email))
                    .ReturnsAsync(user);

            _mockUserRepository.Setup(x => x.AddLoginAsync(user, externalInfo))
                    .ReturnsAsync(IdentityResult.Failed(new IdentityError { Code = "GoogleLinkFailed" }));

            await Assert.ThrowsAsync<Exception>(() => _authenticationService.GoogleLogin());
        }
        [Fact]
        public async Task GoogleLogin_UserCreationFails_ThrowsException()
        {
            var email = "failcreate@gmail.com";
            var claims = new List<Claim>
        {
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Name, "Fail Create")
        };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "Google"));
            var externalInfo = new ExternalLoginInfo(principal, "Google", "google_create_fail", "Google");

            _mockAuthSignInService.Setup(x => x.GetExternalLoginInfoAsync())
                    .ReturnsAsync(externalInfo);

            _mockUserRepository.Setup(x => x.FindByLoginAsync("Google", "google_create_fail"))
                    .ReturnsAsync((AppUser?)null);

            _mockUserRepository.Setup(x => x.FindByEmailAsync(email))
                    .ReturnsAsync((AppUser?)null);

            _mockUserRepository.Setup(x => x.CreateAsync(It.IsAny<AppUser>()))
                    .ReturnsAsync(IdentityResult.Failed(new IdentityError { Code = "UserCreationFailed" }));

            await Assert.ThrowsAsync<Exception>(() => _authenticationService.GoogleLogin());
        }
        [Fact]
        public async Task GoogleLogin_AddToRoleFails_ThrowsException()
        {
            var email = "failrole@gmail.com";
            var claims = new List<Claim>
        {
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Name, "Fail Role")
        };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "Google"));
            var externalInfo = new ExternalLoginInfo(principal, "Google", "google_role_fail", "Google");

            _mockAuthSignInService.Setup(x => x.GetExternalLoginInfoAsync())
                    .ReturnsAsync(externalInfo);

            _mockUserRepository.Setup(x => x.FindByLoginAsync("Google", "google_role_fail"))
                    .ReturnsAsync((AppUser?)null);

            _mockUserRepository.Setup(x => x.FindByEmailAsync(email))
                    .ReturnsAsync((AppUser?)null);

            _mockUserRepository.Setup(x => x.CreateAsync(It.IsAny<AppUser>()))
                    .ReturnsAsync(IdentityResult.Success);

            _mockUserRepository.Setup(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Customer))
                    .ReturnsAsync(IdentityResult.Failed(new IdentityError { Code = "AddToRoleFailed" }));

            await Assert.ThrowsAsync<Exception>(() => _authenticationService.GoogleLogin());
        }
        [Fact]
        public async Task AddPasswordAsync_ValidInput_ReturnsTrue()
        {
            var userId = Guid.NewGuid();
            var password = "NewPassword123!";
            var secondInput = new AddPasswordDto
            {
                NewPassword = password,
                ConfirmPassword = password
            };
            var user = new AppUser
            {
                Id = userId,
                Email = "example@gmail.com",
                PasswordHash = null
            };
            _mockUserRepository.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _mockUserRepository.Setup(x => x.AddPasswordAsync(user, secondInput.NewPassword))
                .ReturnsAsync(IdentityResult.Success);
            var result = await _authenticationService.AddPasswordAsync(userId, secondInput);
            Assert.True(result);
        }
        [Fact]
        public async Task AddPasswordAsync_UserNotFound_ThrowValidationException()
        {
            var userId = Guid.NewGuid();
            var password = "NewPassword123!";
            var secondInput = new AddPasswordDto
            {
                NewPassword = password,
                ConfirmPassword = password
            };
            _mockUserRepository.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync((AppUser?)null);
            await Assert.ThrowsAsync<ValidationException>(() => _authenticationService.AddPasswordAsync(userId, secondInput));
            _mockUserRepository.Verify(x => x.AddPasswordAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
        }
        [Fact]
        public async Task AddPasswordAsync_ArgumentNull_ThrowArgumentNullException()
        {
            var userId = Guid.Empty;
            AddPasswordDto? input = null;

            var ex = await Assert.ThrowsAsync<ArgumentNullException>(
                    () => _authenticationService.AddPasswordAsync(userId, input)
            );
        }
        [Fact]
        public async Task AddPasswordAsync_PasswordsDoNotMatch_ThrowValidationException()
        {
            var userId = Guid.NewGuid();
            var secondInput = new AddPasswordDto
            {
                NewPassword = "NewPassword123!",
                ConfirmPassword = "DifferentPassword123!"
            };
            await Assert.ThrowsAsync<ValidationException>(() => _authenticationService.AddPasswordAsync(userId, secondInput));
            _mockUserRepository.Verify(x => x.FindByIdAsync(It.IsAny<Guid>()), Times.Never);
            _mockUserRepository.Verify(x => x.AddPasswordAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
        }
        [Fact]
        public async Task AddPasswordAsync_UserAlreadyHasAPassword_ThrowValidationException()
        {
            var userId = Guid.NewGuid();
            var secondInput = new AddPasswordDto
            {
                NewPassword = "NewPassword123!",
                ConfirmPassword = "NewPassword123!"
            };
            var existingUser = new AppUser
            {
                Id = userId,
                Email = "example@gmail.com",
                UserName = "example@gmail.com",
                PasswordHash = "hashed_password"
            };
            _mockUserRepository
                .Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(existingUser);

            var ex = await Assert.ThrowsAsync<ValidationException>(
                    () => _authenticationService.AddPasswordAsync(userId, secondInput)
            );
            _mockUserRepository.Verify(x => x.FindByIdAsync(userId), Times.Once);
            _mockUserRepository.Verify(x => x.AddPasswordAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
        }
        [Fact]
        public async Task AddPasswordAsync_AddPasswordFailed_ThrowException()
        {
            var userId = Guid.NewGuid();
            var password = "NewPassword123!";
            var secondInput = new AddPasswordDto
            {
                NewPassword = password,
                ConfirmPassword = password
            };
            var user = new AppUser
            {
                Id = userId,
                Email = "example@gmail.com",
                PasswordHash = null
            };
            _mockUserRepository.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync(user);
            _mockUserRepository.Setup(x => x.AddPasswordAsync(user, secondInput.NewPassword))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError
                {
                    Code = "Failed",
                    Description = "Add password failed"
                }));
            await Assert.ThrowsAsync<Exception>(() => _authenticationService.AddPasswordAsync(userId, secondInput));
            _mockUserRepository.Verify(x => x.FindByIdAsync(userId), Times.Once);
            _mockUserRepository.Verify(x => x.AddPasswordAsync(user, secondInput.NewPassword), Times.Once);
        }
        [Fact]
        public async Task CreateOperatorAsync_InputIsNull_ThrowArgumentException()
        {
            await Assert.ThrowsAsync<ArgumentException>(
                    () => _authenticationService.CreateOperatorAsync(null!)
            );
        }

        [Fact]
        public async Task CreateOperatorAsync_EmailAlreadyExists_ThrowValidationException()
        {
            var input = new CreateOperatorRequestDto
            {
                Email = "example@gmail.com",
                Username = "example",
                Password = "Password123!"
            };

            _mockUserRepository
                    .Setup(x => x.FindByEmailAsync(input.Email))
                    .ReturnsAsync(new AppUser());

            await Assert.ThrowsAsync<ValidationException>(
                    () => _authenticationService.CreateOperatorAsync(input)
            );

            _mockUserRepository.Verify(x => x.FindByEmailAsync(input.Email), Times.Once);
        }

        [Fact]
        public async Task CreateOperatorAsync_UserCreationFailed_ThrowValidationException()
        {
            var input = new CreateOperatorRequestDto
            {
                Email = "example@gmail.com",
                Username = "example",
                Password = "Password123!"
            };

            _mockUserRepository.Setup(x => x.FindByEmailAsync(input.Email))
                    .ReturnsAsync((AppUser?)null);

            _mockUserRepository.Setup(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password))
                    .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Error" }));

            await Assert.ThrowsAsync<ValidationException>(
                    () => _authenticationService.CreateOperatorAsync(input)
            );

            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password), Times.Once);
        }

        [Fact]
        public async Task CreateOperatorAsync_AddToRoleFailed_ThrowValidationException()
        {
            var input = new CreateOperatorRequestDto
            {
                Email = "example@gmail.com",
                Username = "example",
                Password = "Password123!"
            };

            _mockUserRepository.Setup(x => x.FindByEmailAsync(input.Email))
                    .ReturnsAsync((AppUser?)null);

            _mockUserRepository.Setup(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password))
                    .ReturnsAsync(IdentityResult.Success);

            _mockUserRepository.Setup(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Operator))
                    .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Add role failed" }));

            await Assert.ThrowsAsync<ValidationException>(
                    () => _authenticationService.CreateOperatorAsync(input)
            );

            _mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Operator), Times.Once);
        }

        [Fact]
        public async Task CreateOperatorAsync_Success_ReturnUserId()
        {
            var input = new CreateOperatorRequestDto
            {
                Email = "example@gmail.com",
                Username = "example",
                Password = "Password123!"
            };

            var createdUser = new AppUser { Id = Guid.NewGuid(), Email = input.Email };

            _mockUserRepository.Setup(x => x.FindByEmailAsync(input.Email))
                    .ReturnsAsync((AppUser?)null);

            _mockUserRepository.Setup(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password))
                    .Callback<AppUser, string>((u, p) => u.Id = createdUser.Id)
                    .ReturnsAsync(IdentityResult.Success);

            _mockUserRepository.Setup(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Operator))
                    .ReturnsAsync(IdentityResult.Success);
            var mockTransaction = new Mock<IDbContextTransaction>();
            _mockUnitOfWork
                .Setup(x => x.BeginTransactionAsync())
                .ReturnsAsync(mockTransaction.Object);
            _mockUnitOfWork
                .Setup(x => x.CommitTransactionAsync())
                .Returns(Task.CompletedTask);
            _mockUnitOfWork
                    .Setup(x => x.SaveChangesAsync())
                    .ReturnsAsync(1);

            var result = await _authenticationService.CreateOperatorAsync(input);

            Assert.Equal(createdUser.Id, result);
            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password), Times.Once);
            _mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Operator), Times.Once);
            _mockUnitOfWork.Verify(x => x.CommitTransactionAsync(), Times.Once);
        }
        #region RequestPasswordResetAsync

        [Fact]
        public async Task RequestPasswordResetAsync_InputIsNull_ThrowArgumentException()
        {
            await Assert.ThrowsAsync<ArgumentException>(
                    () => _authenticationService.RequestPasswordResetAsync(null!)
            );
        }

        [Fact]
        public async Task RequestPasswordResetAsync_UserNotFound_ThrowValidationException()
        {
            var input = new ForgetPasswordDto { Email = "notfound@gmail.com" };

            _mockUserRepository.Setup(x => x.FindByEmailAsync(input.Email))
                    .ReturnsAsync((AppUser?)null);

            await Assert.ThrowsAsync<ValidationException>(
                    () => _authenticationService.RequestPasswordResetAsync(input)
            );
        }

        [Fact]
        public async Task RequestPasswordResetAsync_Success_ReturnTrue()
        {
            var input = new ForgetPasswordDto { Email = "example@gmail.com" };
            var user = new AppUser { Id = Guid.NewGuid(), Email = input.Email, FullName = "Test" };

            _mockUserRepository.Setup(x => x.FindByEmailAsync(input.Email))
                    .ReturnsAsync(user);

            _mockUserRepository.Setup(x => x.GeneratePasswordResetTokenAsync(user))
                    .ReturnsAsync("reset_token");

            _mockEmailTemplateService.Setup(x => x.RenderAsync(
                    "/Views/Emails/ResetPassword.cshtml",
                    It.IsAny<Dtos.EmailDto.ResetPasswordDto>()))
                    .ReturnsAsync("<html>Email</html>");

            _mockEmailService.Setup(x => x.SendEmailAsync(It.IsAny<EmailDto>()))
                    .Returns(Task.CompletedTask);

            var result = await _authenticationService.RequestPasswordResetAsync(input);

            Assert.True(result);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Once);
        }

        #endregion
        #region ResetPasswordAsync

        [Fact]
        public async Task ResetPasswordAsync_InputIsNull_ThrowArgumentException()
        {
            await Assert.ThrowsAsync<ArgumentException>(
                    () => _authenticationService.ResetPasswordAsync(null!)
            );
        }

        [Fact]
        public async Task ResetPasswordAsync_PasswordsDoNotMatch_ThrowValidationException()
        {
            var input = new Core.Dtos.AuthenticationDto.ResetPasswordDto
            {
                NewPassword = "Password1!",
                ConfirmPassword = "Different!"
            };

            await Assert.ThrowsAsync<ValidationException>(
                    () => _authenticationService.ResetPasswordAsync(input)
            );
        }

        [Fact]
        public async Task ResetPasswordAsync_UserNotFound_ThrowValidationException()
        {
            var input = new Core.Dtos.AuthenticationDto.ResetPasswordDto
            {
                UserId = Guid.NewGuid(),
                Token = "token",
                NewPassword = "Password123!",
                ConfirmPassword = "Password123!"
            };

            _mockUserRepository.Setup(x => x.FindByIdAsync(input.UserId))
                    .ReturnsAsync((AppUser?)null);

            await Assert.ThrowsAsync<ValidationException>(
                    () => _authenticationService.ResetPasswordAsync(input)
            );
        }

        [Fact]
        public async Task ResetPasswordAsync_ResetPasswordFailed_ThrowValidationException()
        {
            var token = "token";
            var encoded = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

            var input = new Core.Dtos.AuthenticationDto.ResetPasswordDto
            {
                UserId = Guid.NewGuid(),
                Token = encoded,
                NewPassword = "Password123!",
                ConfirmPassword = "Password123!"
            };

            var user = new AppUser { Id = input.UserId };

            _mockUserRepository.Setup(x => x.FindByIdAsync(input.UserId))
                    .ReturnsAsync(user);

            _mockUserRepository.Setup(x => x.ResetPasswordAsync(user, token, input.NewPassword))
                    .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Error" }));

            await Assert.ThrowsAsync<ValidationException>(
                    () => _authenticationService.ResetPasswordAsync(input)
            );

            _mockUserRepository.Verify(x => x.ResetPasswordAsync(user, token, input.NewPassword), Times.Once);
        }

        [Fact]
        public async Task ResetPasswordAsync_Success_ReturnTrue()
        {
            var token = "token";
            var encoded = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

            var input = new Core.Dtos.AuthenticationDto.ResetPasswordDto
            {
                UserId = Guid.NewGuid(),
                Token = encoded,
                NewPassword = "Password123!",
                ConfirmPassword = "Password123!"
            };

            var user = new AppUser { Id = input.UserId };

            _mockUserRepository.Setup(x => x.FindByIdAsync(input.UserId))
                    .ReturnsAsync(user);

            _mockUserRepository.Setup(x => x.ResetPasswordAsync(user, token, input.NewPassword))
                    .ReturnsAsync(IdentityResult.Success);

            var result = await _authenticationService.ResetPasswordAsync(input);

            Assert.True(result);
            _mockUserRepository.Verify(x => x.ResetPasswordAsync(user, token, input.NewPassword), Times.Once);
        }

        #endregion
        [Fact]
        public async Task ChangePassword_Success_ReturnsSuccessResponse()
        {
            var userId = Guid.NewGuid();
            var input = new ChangePasswordRequestDto
            {
                CurrentPassword = "Ntl0979735203@@",
                NewPassword = "Ntl0979735203@@@",
                ConfirmNewPassword = "Ntl0979735203@@@"
            };

            var user = new AppUser
            {
                Id = userId,
                Email = "example@gmail.com",
                MustChangePasswordOnLogin = false
            };

            _mockUserRepository.Setup(x => x.FindByIdAsync(userId)).ReturnsAsync(user);
            _mockUserRepository.Setup(x => x.CheckPasswordAsync(user, input.CurrentPassword)).ReturnsAsync(true);
            _mockUserRepository.Setup(x => x.ChangePasswordAsync(user, input.CurrentPassword, input.NewPassword))
                    .ReturnsAsync(IdentityResult.Success);

            var result = await _authenticationService.ChangePassword(userId, input);

            Assert.NotNull(result);
            Assert.IsType<ChangePasswordResponseDto>(result);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never);
        }
        [Fact]
        public async Task ChangePassword_InputIsNull_ThrowArgumentException()
        {
            var userId = Guid.NewGuid();

            await Assert.ThrowsAsync<ArgumentException>(
                    () => _authenticationService.ChangePassword(userId, null!)
            );
        }
        [Fact]
        public async Task ChangePassword_MustChangePasswordOnLogin_UpdatesFlagAndSaves()
        {
            var userId = Guid.NewGuid();
            var input = new ChangePasswordRequestDto
            {
                CurrentPassword = "Ntl0979735203@@",
                NewPassword = "Ntl0979735203@@@",
                ConfirmNewPassword = "Ntl0979735203@@@"
            };

            var user = new AppUser
            {
                Id = userId,
                Email = "example@gmail.com",
                MustChangePasswordOnLogin = true
            };

            _mockUserRepository.Setup(x => x.FindByIdAsync(userId)).ReturnsAsync(user);
            _mockUserRepository.Setup(x => x.CheckPasswordAsync(user, input.CurrentPassword)).ReturnsAsync(true);
            _mockUserRepository.Setup(x => x.ChangePasswordAsync(user, input.CurrentPassword, input.NewPassword))
                    .ReturnsAsync(IdentityResult.Success);

            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _authenticationService.ChangePassword(userId, input);

            Assert.NotNull(result);
            Assert.False(user.MustChangePasswordOnLogin);

            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }
        [Fact]
        public async Task ChangePassword_ChangePasswordFailed_ThrowValidationException()
        {
            var userId = Guid.NewGuid();
            var input = new ChangePasswordRequestDto
            {
                CurrentPassword = "Ntl0979735203@@",
                NewPassword = "Ntl0979735203@@@",
                ConfirmNewPassword = "Ntl0979735203@@@"
            };

            var user = new AppUser { Id = userId, Email = "example@gmail.com" };

            _mockUserRepository.Setup(x => x.FindByIdAsync(userId))
                    .ReturnsAsync(user);

            _mockUserRepository.Setup(x => x.CheckPasswordAsync(user, input.CurrentPassword))
                    .ReturnsAsync(true);

            _mockUserRepository.Setup(x => x.ChangePasswordAsync(user, input.CurrentPassword, input.NewPassword))
                    .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Password policy failed" }));

            var ex = await Assert.ThrowsAsync<ValidationException>(
                    () => _authenticationService.ChangePassword(userId, input)
            );
        }
        [Fact]
        public async Task ChangePassword_CurrentPasswordIncorrect_ThrowValidationException()
        {
            var userId = Guid.NewGuid();
            var input = new ChangePasswordRequestDto
            {
                CurrentPassword = "123456789@",
                NewPassword = "Ntl0979735203@@@",
                ConfirmNewPassword = "Ntl0979735203@@@"
            };

            var user = new AppUser { Id = userId, Email = "example@gmail.com" };

            _mockUserRepository.Setup(x => x.FindByIdAsync(userId))
                    .ReturnsAsync(user);

            _mockUserRepository.Setup(x => x.CheckPasswordAsync(user, input.CurrentPassword))
                    .ReturnsAsync(false);

            await Assert.ThrowsAsync<ValidationException>(
                    () => _authenticationService.ChangePassword(userId, input)
            );

            _mockUserRepository.Verify(x => x.CheckPasswordAsync(user, input.CurrentPassword), Times.Once);
        }
        [Fact]
        public async Task ChangePassword_UserNotFound_ThrowValidationException()
        {
            var userId = Guid.NewGuid();
            var input = new ChangePasswordRequestDto
            {
                CurrentPassword = "Ntl0979735203@@",
                NewPassword = "Ntl0979735203@@@",
                ConfirmNewPassword = "Ntl0979735203@@@"
            };

            _mockUserRepository.Setup(x => x.FindByIdAsync(userId))
                    .ReturnsAsync((AppUser?)null);

            await Assert.ThrowsAsync<ValidationException>(
                    () => _authenticationService.ChangePassword(userId, input)
            );

            _mockUserRepository.Verify(x => x.FindByIdAsync(userId), Times.Once);
        }

    }
}