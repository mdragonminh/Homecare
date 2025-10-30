using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Implementations;
using HSP.Service.Interfaces;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using Moq;

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
		//[Fact]
		//public async Task AuthenticateWithGoogleAsync_UserExists_ReturnsJwtToken()
		//{
		//	// Arrange
		//	var googleToken = "valid_google_token";
		//	var userId = Guid.NewGuid();
		//	var user = new AppUser
		//	{
		//		Id = userId,
		//		Email = "abc@gmail.com",
		//	}
		//}
	}
}
