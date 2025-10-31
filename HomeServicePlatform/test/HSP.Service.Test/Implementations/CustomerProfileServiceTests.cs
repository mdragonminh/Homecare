using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HSP.Core.Dtos.AppUserDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Implementations;
using HSP.Service.Dtos.EmailDto;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;
using Moq;
using Xunit;

namespace HSP.Service.Test.Implementations
{
    public class CustomerProfileServiceTests
    {
        private readonly Mock<UserManager<AppUser>> _userManagerMock;
        private readonly Mock<RoleManager<AppRole>> _roleManagerMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<IRepository<HSP.Core.Entities.File, Guid>> _fileRepositoryMock;
        private readonly Mock<IRepository<FileRelation, Guid>> _fileRelationRepositoryMock;
        private readonly Mock<IRepository<ObjectType, Guid>> _objectTypeRepositoryMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IStringLocalizer<SharedResource>> _localizerMock;

        private readonly CustomerProfileService _service;

        public CustomerProfileServiceTests()
        {
            _userManagerMock = MockUserManager();
            _roleManagerMock = MockRoleManager();
            _emailServiceMock = new Mock<IEmailService>();
            _configurationMock = new Mock<IConfiguration>();
            _fileRepositoryMock = new Mock<IRepository<HSP.Core.Entities.File, Guid>>();
            _fileRelationRepositoryMock = new Mock<IRepository<FileRelation, Guid>>();
            _objectTypeRepositoryMock = new Mock<IRepository<ObjectType, Guid>>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResource>>();

            _service = new CustomerProfileService(
                _unitOfWorkMock.Object,
                _localizerMock.Object,
                _userManagerMock.Object,
                _roleManagerMock.Object,
                _emailServiceMock.Object,
                _configurationMock.Object,
                _fileRepositoryMock.Object,
                _fileRelationRepositoryMock.Object,
                _objectTypeRepositoryMock.Object
            );
        }

        #region Helper Mocks
        private static Mock<UserManager<AppUser>> MockUserManager()
        {
            var store = new Mock<IUserStore<AppUser>>();
            return new Mock<UserManager<AppUser>>(
                store.Object, null, null, null, null, null, null, null, null);
        }

        private static Mock<RoleManager<AppRole>> MockRoleManager()
        {
            var store = new Mock<IRoleStore<AppRole>>();
            return new Mock<RoleManager<AppRole>>(
                store.Object, null, null, null, null);
        }
        #endregion

        #region GetCustomerByUserIdAsync
        [Fact]
        public async Task GetCustomerByUserIdAsync_ShouldThrow_WhenInvalidGuid()
        {
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.GetCustomerByUserIdAsync("invalid-guid"));
        }




        #endregion

        #region UpdateCustomerAsync
        [Fact]
        public async Task UpdateCustomerAsync_ShouldThrow_WhenInvalidGuid()
        {
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.UpdateCustomerAsync("invalid-guid", new UpdateAppUserDto()));
        }

        [Fact]
        public async Task UpdateCustomerAsync_ShouldThrow_WhenUserNotFound()
        {
            _userManagerMock.Setup(x => x.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync((AppUser)null);

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.UpdateCustomerAsync(Guid.NewGuid().ToString(), new UpdateAppUserDto()));
        }


        #endregion

        #region RequestEmailChangeAsync
        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnError_WhenInvalidUserId()
        {
            var result = await _service.RequestEmailChangeAsync("invalid", "new@example.com");
            Assert.False(result.Success);
            Assert.Contains("User ID", result.Message);
        }

        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnError_WhenUserNotFound()
        {
            _userManagerMock.Setup(x => x.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync((AppUser)null);

            var result = await _service.RequestEmailChangeAsync(Guid.NewGuid().ToString(), "new@example.com");
            Assert.False(result.Success);
            Assert.Contains("Không tìm thấy", result.Message);
        }

        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnSuccess_WhenValid()
        {
            // Arrange
            var user = new AppUser { Id = Guid.NewGuid(), FullName = "Test", Email = "old@mail.com" };
            _userManagerMock.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync(user);
            _userManagerMock.Setup(x => x.GenerateChangeEmailTokenAsync(It.IsAny<AppUser>(), It.IsAny<string>()))
                .ReturnsAsync("token");
            _configurationMock.Setup(x => x["UrlSettings:FrontendEmailChange"])
                .Returns("https://example.com");
            _emailServiceMock.Setup(x => x.SendEmailAsync(It.IsAny<EmailDto>())).Returns(Task.CompletedTask);

            // Act
            var result = await _service.RequestEmailChangeAsync(user.Id.ToString(), "new@mail.com");

            // Assert
            Assert.True(result.Success);
            Assert.Equal("new@mail.com", result.NewEmail);
        }
        #endregion

        #region ConfirmEmailChangeAsync
        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldFail_WhenTokenInvalid()
        {
            var result = await _service.ConfirmEmailChangeAsync(Guid.NewGuid().ToString(), "invalid-base64");
            Assert.False(result.Success);
        }

        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldFail_WhenUserNotFound()
        {
            var userId = Guid.NewGuid().ToString();
            var tokenBytes = Encoding.UTF8.GetBytes($"{userId}:new@mail.com:token");
            var token = Convert.ToBase64String(tokenBytes);
            _userManagerMock.Setup(x => x.FindByIdAsync(userId)).ReturnsAsync((AppUser)null);

            var result = await _service.ConfirmEmailChangeAsync(userId, token);
            Assert.False(result.Success);
            Assert.Contains("Không tìm thấy", result.Message);
        }

        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldSuccess_WhenValid()
        {
            var user = new AppUser { Id = Guid.NewGuid(), Email = "old@mail.com" };
            var tokenBytes = Encoding.UTF8.GetBytes($"{user.Id}:new@mail.com:tokendata");
            var token = Convert.ToBase64String(tokenBytes);

            _userManagerMock.Setup(x => x.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
            _userManagerMock.Setup(x => x.ChangeEmailAsync(user, "new@mail.com", "tokendata"))
                .ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<AppUser>()))
                .ReturnsAsync(IdentityResult.Success);

            var result = await _service.ConfirmEmailChangeAsync(user.Id.ToString(), token);

            Assert.True(result.Success);
            Assert.Equal("new@mail.com", result.NewEmail);
        }
        #endregion

        #region GetDebugInfoAsync
        [Fact]
        public async Task GetDebugInfoAsync_ShouldReturnError_WhenRoleNotFound()
        {
            _roleManagerMock.Setup(x => x.FindByNameAsync("Customer")).ReturnsAsync((AppRole)null);
            var result = await _service.GetDebugInfoAsync();

            Assert.NotNull(result);
            Assert.Contains("Error", result.GetType().GetProperties().Select(p => p.Name));
        }
        #endregion
    }

    // Add this helper class to the test namespace (or in a suitable test utilities file)
    public static class DbSetMockingExtensions
    {
        public static Mock<DbSet<T>> BuildMockDbSet<T>(this IQueryable<T> source) where T : class
        {
            var mockSet = new Mock<DbSet<T>>();
            mockSet.As<IQueryable<T>>().Setup(m => m.Provider).Returns(source.Provider);
            mockSet.As<IQueryable<T>>().Setup(m => m.Expression).Returns(source.Expression);
            mockSet.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(source.ElementType);
            mockSet.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(source.GetEnumerator());
            return mockSet;
        }
    }
}
