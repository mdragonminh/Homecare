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
using System.Text;
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
        // ============================================================
        // ✅ TEST: RequestEmailChangeAsync (bổ sung)
        // ============================================================

        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnError_WhenNewEmailSameAsOld()
        {
            // Arrange
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "old@example.com",
                FullName = "John Doe"
            };

            _userRepoMock.Setup(x => x.FindByIdAsync(user.Id)).ReturnsAsync(user);

            // Act
            var result = await _service.RequestEmailChangeAsync(user.Id.ToString(), "old@example.com");

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Email mới không được trùng với email hiện tại", result.Message);
        }

        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnError_WhenNewEmailAlreadyExists()
        {
            // Arrange
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "user1@example.com",
                FullName = "John Doe"
            };

            var existingUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "new@example.com"
            };

            _userRepoMock.Setup(x => x.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepoMock.Setup(x => x.FindByEmailAsync("new@example.com")).ReturnsAsync(existingUser);

            // Act
            var result = await _service.RequestEmailChangeAsync(user.Id.ToString(), "new@example.com");

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Email này đã được sử dụng bởi tài khoản khác", result.Message);
        }

        // ============================================================
        // ✅ TEST: ConfirmEmailChangeAsync (bổ sung)
        // ============================================================

        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldReturnSuccess_WhenTokenValid()
        {
            // Arrange
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "old@example.com",
                FullName = "John Doe",
                UserName = "old@example.com"
            };

            string newEmail = "new@example.com";
            string fakeToken = "VALID_TOKEN";

            // Token = userId:newEmail:token
            string tokenString = $"{user.Id}:{newEmail}:{fakeToken}";
            string base64Token = Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenString));

            _userRepoMock.Setup(x => x.FindByIdAsync(user.Id))
                         .ReturnsAsync(user);

            _userRepoMock.Setup(x => x.FindByEmailAsync(newEmail))
                         .ReturnsAsync((AppUser?)null);

            _userRepoMock.Setup(x => x.ChangeEmailAsync(user, newEmail, fakeToken))
                         .ReturnsAsync(IdentityResult.Success);

            // ✅ Vì UpdateAccount trả về Task<IdentityResult>
            _userRepoMock.Setup(x => x.UpdateAccount(It.IsAny<AppUser>()))
                         .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _service.ConfirmEmailChangeAsync(user.Id.ToString(), base64Token);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("Email đã được thay đổi thành công", result.Message);
            Assert.Equal(newEmail, result.NewEmail);
        }



        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldReturnError_WhenChangeEmailFails()
        {
            // Arrange
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "old@example.com",
                FullName = "John Doe"
            };

            string newEmail = "new@example.com";
            string fakeToken = "INVALID_TOKEN";

            string tokenString = $"{user.Id}:{newEmail}:{fakeToken}";
            string base64Token = Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenString));

            _userRepoMock.Setup(x => x.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepoMock.Setup(x => x.FindByEmailAsync(newEmail)).ReturnsAsync((AppUser?)null);
            _userRepoMock.Setup(x => x.ChangeEmailAsync(user, newEmail, fakeToken))
                         .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Invalid token" }));

            // Act
            var result = await _service.ConfirmEmailChangeAsync(user.Id.ToString(), base64Token);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Không thể thay đổi email", result.Message);
        }

        [Fact]
        public async Task GetCustomerByUserIdAsync_ShouldThrow_WhenUserInactive()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Nguyen Van B",
                Email = "inactive@example.com",
                IsActive = false
            };

            var mockUsers = new List<AppUser> { user }.BuildMock();
            _userRepoMock.Setup(r => r.GetUsersAsQueryable()).Returns(mockUsers);

            // Act + Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.GetCustomerByUserIdAsync(userId.ToString()));
        }


        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnError_WhenSendEmailFails()
        {
            // Arrange
            var user = new AppUser { Id = Guid.NewGuid(), Email = "old@example.com", FullName = "John Doe" };
            _userRepoMock.Setup(x => x.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepoMock.Setup(x => x.FindByEmailAsync("new@example.com")).ReturnsAsync((AppUser?)null);
            _userRepoMock.Setup(x => x.GenerateChangeEmailTokenAsync(user, "new@example.com")).ReturnsAsync("FAKE_TOKEN");
            _configMock.Setup(x => x["UrlSettings:FrontendEmailChange"]).Returns("https://example.com/confirm");

            // 🔴 Giả lập lỗi gửi email
            _emailServiceMock.Setup(x => x.SendEmailAsync(It.IsAny<EmailDto>()))
                             .ThrowsAsync(new Exception("SMTP error"));

            // Act
            var result = await _service.RequestEmailChangeAsync(user.Id.ToString(), "new@example.com");

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Lỗi khi gửi email xác thực", result.Message);

        }


        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldReturnError_WhenUserNotFound()
        {
            var userId = Guid.NewGuid();
            string newEmail = "new@example.com";
            string fakeToken = "VALID_TOKEN";
            string base64Token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{userId}:{newEmail}:{fakeToken}"));

            _userRepoMock.Setup(x => x.FindByIdAsync(userId)).ReturnsAsync((AppUser?)null);

            var result = await _service.ConfirmEmailChangeAsync(userId.ToString(), base64Token);

            Assert.False(result.Success);
            Assert.Contains("Không tìm thấy người dùng", result.Message);
        }

        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldReturnError_WhenEmailAlreadyInUse()
        {
            var user = new AppUser { Id = Guid.NewGuid(), Email = "old@example.com" };
            var otherUser = new AppUser { Id = Guid.NewGuid(), Email = "new@example.com" };
            string fakeToken = "VALID_TOKEN";
            string base64Token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{user.Id}:{otherUser.Email}:{fakeToken}"));

            _userRepoMock.Setup(x => x.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepoMock.Setup(x => x.FindByEmailAsync(otherUser.Email)).ReturnsAsync(otherUser);

            var result = await _service.ConfirmEmailChangeAsync(user.Id.ToString(), base64Token);

            Assert.False(result.Success);
            Assert.Contains("Email này đã được sử dụng", result.Message);
        }



    }
}
