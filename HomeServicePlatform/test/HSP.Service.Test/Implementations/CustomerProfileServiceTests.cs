using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Implementations;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using MockQueryable;
using MockQueryable.Core;
using MockQueryable.Moq;          // <-- bắt buộc cho BuildMock()
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;



namespace HSP.Service.Test.Implementations
{
    // ============================================================
    //  ✅ TESTS FOR: CustomerProfileService
    // ============================================================

    public class CustomerProfileServiceTests
    {
        private readonly Mock<RoleManager<AppRole>> _roleManagerMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly Mock<IRepository<HSP.Core.Entities.File, Guid>> _fileRepoMock;
        private readonly Mock<IRepository<FileRelation, Guid>> _fileRelRepoMock;
        private readonly Mock<IRepository<ObjectType, Guid>> _objTypeRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IStringLocalizer<SharedResource>> _localizerMock;
        private readonly CustomerProfileService _service;

        public CustomerProfileServiceTests()
        {
            _roleManagerMock = MockRoleManager();
            _emailServiceMock = new Mock<IEmailService>();
            _configMock = new Mock<IConfiguration>();
            _fileRepoMock = new Mock<IRepository<HSP.Core.Entities.File, Guid>>();
            _fileRelRepoMock = new Mock<IRepository<FileRelation, Guid>>();
            _objTypeRepoMock = new Mock<IRepository<ObjectType, Guid>>();
            _userRepoMock = new Mock<IUserRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResource>>();

            _service = new CustomerProfileService(
                _unitOfWorkMock.Object,
                _localizerMock.Object,
                _roleManagerMock.Object,
                _emailServiceMock.Object,
                _configMock.Object,
                _fileRepoMock.Object,
                _fileRelRepoMock.Object,
                _objTypeRepoMock.Object,
                _userRepoMock.Object
            );
        }

        // Helper để mock RoleManager
        private static Mock<RoleManager<AppRole>> MockRoleManager()
        {
            var store = new Mock<IRoleStore<AppRole>>();

            // Provide non-null values for RoleManager constructor to avoid CS8625.
            var roleValidators = new List<IRoleValidator<AppRole>>();
            var lookupNormalizer = Mock.Of<ILookupNormalizer>();
            var identityErrors = new IdentityErrorDescriber();
            var logger = Mock.Of<ILogger<RoleManager<AppRole>>>();

            return new Mock<RoleManager<AppRole>>(
                store.Object,
                roleValidators,
                lookupNormalizer,
                identityErrors,
                logger
            );
        }

        // ============================================================
        //  ✅ TEST: GetCustomerByUserIdAsync
        // ============================================================

        [Fact]
        public async Task GetCustomerByUserIdAsync_ShouldThrow_WhenInvalidGuid()
        {
            string invalidUserId = "abc123";
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.GetCustomerByUserIdAsync(invalidUserId));
        }

        [Fact]
        public async Task GetCustomerByUserIdAsync_ShouldThrow_WhenUserNotFound()
        {
            // Arrange
            string validId = Guid.NewGuid().ToString();

            // ✅ Cách đúng: Gọi BuildMock() trực tiếp từ List<AppUser>
            var emptyListMock = new List<AppUser>().BuildMock();

            // Trả về IQueryable<AppUser> từ mock
            _userRepoMock.Setup(x => x.GetUsersAsQueryable())
                         .Returns(emptyListMock);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.GetCustomerByUserIdAsync(validId));
        }


        //[Fact]
        //public async Task GetCustomerByUserIdAsync_ShouldReturnUser_WhenUserExists()
        //{
        //    // Arrange
        //    var userId = Guid.NewGuid();
        //    var user = new AppUser
        //    {
        //        Id = userId,
        //        FullName = "Nguyen Van A",
        //        Email = "a@example.com",
        //        PhoneNumber = "0123456789",
        //        IsActive = true,
        //        Homes = new List<Home> { new Home { Id = Guid.NewGuid(), IsDeleted = false } }
        //    };

        //    // ✅ Sử dụng BuildMockDbSet() để hỗ trợ async LINQ
        //    var mockUsers = new List<AppUser> { user }.BuildMockDbSet();

        //    _userRepoMock.Setup(r => r.GetUsersAsQueryable()).Returns(mockUsers.Object);

        //    // Act
        //    var result = await _service.GetCustomerByUserIdAsync(userId.ToString());

        //    // Assert
        //    Assert.NotNull(result);
        //    Assert.Equal(userId, result.Id);
        //    Assert.Equal("Nguyen Van A", result.FullName);
        //    Assert.Equal("a@example.com", result.Email);
        //    Assert.True(result.IsActive);
        //    Assert.Equal(1, result.TotalHomes);
        //}



        // ============================================================
        //  ✅ TEST: RequestEmailChangeAsync
        // ============================================================

        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnError_WhenInvalidUserId()
        {
            var result = await _service.RequestEmailChangeAsync("not-guid", "new@example.com");
            Assert.False(result.Success);
            Assert.Contains("User ID", result.Message);
        }

        [Fact]      
        public async Task RequestEmailChangeAsync_ShouldReturnError_WhenUserNotFound()
        {
            string userId = Guid.NewGuid().ToString();
            _userRepoMock.Setup(x => x.FindByIdAsync(It.IsAny<Guid>())).ReturnsAsync((AppUser?)null);

            var result = await _service.RequestEmailChangeAsync(userId, "new@example.com");

            Assert.False(result.Success);
            Assert.Contains("Không tìm thấy người dùng", result.Message);
        }

        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnSuccess_WhenValid()
        {
            var user = new AppUser { Id = Guid.NewGuid(), Email = "old@example.com", FullName = "John Doe" };
            string newEmail = "new@example.com";

            _userRepoMock.Setup(x => x.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepoMock.Setup(x => x.FindByEmailAsync(newEmail)).ReturnsAsync((AppUser?)null);
            _userRepoMock.Setup(x => x.GenerateChangeEmailTokenAsync(user, newEmail)).ReturnsAsync("FAKE_TOKEN");

            _configMock.Setup(x => x["UrlSettings:FrontendEmailChange"])
                       .Returns("https://example.com/confirm");

            _emailServiceMock.Setup(x => x.SendEmailAsync(It.IsAny<EmailDto>())).Returns(Task.CompletedTask);

            var result = await _service.RequestEmailChangeAsync(user.Id.ToString(), newEmail);

            Assert.True(result.Success);
            Assert.Equal(newEmail, result.NewEmail);
            Assert.Contains("Email xác thực", result.Message);
        }

        // ============================================================
        //  ✅ TEST: ConfirmEmailChangeAsync
        // ============================================================

        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldReturnError_WhenInvalidToken()
        {
            var result = await _service.ConfirmEmailChangeAsync(Guid.NewGuid().ToString(), "INVALID_BASE64");

            Assert.False(result.Success);
            Assert.Contains("Lỗi khi xác nhận", result.Message);
        }
    }
}
