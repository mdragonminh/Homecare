using HSP.Core.Constans;
using HSP.Core.Constants;
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
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using Moq;
using System.ComponentModel.DataAnnotations;
using MockQueryable.Moq;
using MockQueryable;

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
				_mockUnitOfWork.Object,
				_mockLocalizer.Object
			);
		}
		[Fact]
		public async Task Register_ValidInput_ReturnsRegisterResponseDto()
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
				Email = "email@gmail.com",
				FullName = "fullName",
				PhoneNumber = "0888777222",
				Password = "Password123!",
				ConfirmPassword = "Password123@"
			};
			await Assert.ThrowsAsync<ValidationException>(() => _authenticationService.Register(input));
			_mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
			_mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Customer), Times.Never);
			_mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
		}
		[Fact]
		public async Task Register_WhenEmailAlreadyExistsWithEmailConfirmed_ThrowsException()
		{
			string ExistingEmail = "email@gmail.com";
			_mockUserRepository
			 .Setup(x => x.FindByEmailAsync(ExistingEmail))
			 .ReturnsAsync(new AppUser
			 {
				 Id = Guid.NewGuid(),
				 Email = "email@gmail.com",
				 UserName = "email@gmail.com",
				 FullName = "fullName",
				 PhoneNumber = "0888777222",
				 EmailConfirmed = true
			 });
			var input = new RegisterRequestDto
			{
				Email = "email@gmail.com",
				FullName = "fullName",
				PhoneNumber = "0888777222",
				Password = "Password123!",
				ConfirmPassword = "Password123!"
			};
			await Assert.ThrowsAsync<ValidationException>(() => _authenticationService.Register(input));
			_mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password), Times.Never);
			_mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Customer), Times.Never);
			_mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
		}
		[Fact]
		public async Task Register_WhenEmailAlreadyExistsWithEmailNotConfirmed_ReturnsNewTokenAndSendsEmail()
		{
			string ExistingEmail = "email@gmail.com";
			_mockUserRepository
			 .Setup(x => x.FindByEmailAsync(ExistingEmail))
			 .ReturnsAsync(new AppUser
			 {
				 Id = Guid.NewGuid(),
				 Email = "email@gmail.com",
				 UserName = "email@gmail.com",
				 FullName = "fullName",
				 PhoneNumber = "0888777222",
				 EmailConfirmed = false
			 });
			var input = new RegisterRequestDto
			{
				Email = "email@gmail.com",
				FullName = "fullName",
				PhoneNumber = "0888777222",
				Password = "Password123!",
				ConfirmPassword = "Password123!"
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
				Password = "Password123!",
				ConfirmPassword = "Password123!",
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

			var result = await _authenticationService.RegisterTechnician(input);

			Assert.NotNull(result);
			Assert.Equal(input.Email, result.Email);
			Assert.False(string.IsNullOrEmpty(result.EmailConfirmToken));

			_mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<AppUser>(), input.Password), Times.Once);
			_mockUserRepository.Verify(x => x.AddToRoleAsync(It.IsAny<AppUser>(), RoleNames.Technician), Times.Once);
			_mockTechnicianProfileRepository.Verify(x => x.AddAsync(It.IsAny<TechnicianProfile>()), Times.Once);
			_mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Once);
			_mockFileService.Verify(x => x.UploadAsync(It.IsAny<FileUploadDto>()), Times.Once);
			_mockFileService.Verify(x => x.UploadManyAsync(It.IsAny<IEnumerable<FileUploadDto>>()), Times.Once);
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
	}
}