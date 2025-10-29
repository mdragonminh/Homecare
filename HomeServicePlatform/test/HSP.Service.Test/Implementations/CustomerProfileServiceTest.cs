using System.Linq;
using HSP.Core.Dtos.AppUserDto;
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
using Microsoft.Extensions.Options;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using System.Linq;
using System.Text;
using Xunit;
using System;
using System.Collections.Generic;

namespace HSP.Service.Test.Implementations
{
    public class CustomerProfileServiceTest
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IStringLocalizer<SharedResource>> _localizerMock;
        private readonly Mock<UserManager<AppUser>> _userManagerMock;
        private readonly Mock<RoleManager<AppRole>> _roleManagerMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<IRepository<HSP.Core.Entities.File, Guid>> _fileRepositoryMock;
        private readonly Mock<IRepository<FileRelation, Guid>> _fileRelationRepositoryMock;
        private readonly Mock<IRepository<ObjectType, Guid>> _objectTypeRepositoryMock;
        private readonly CustomerProfileService _service;

        public CustomerProfileServiceTest()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResource>>();
            _emailServiceMock = new Mock<IEmailService>();
            _configurationMock = new Mock<IConfiguration>();
            _fileRepositoryMock = new Mock<IRepository<HSP.Core.Entities.File, Guid>>();
            _fileRelationRepositoryMock = new Mock<IRepository<FileRelation, Guid>>();
            _objectTypeRepositoryMock = new Mock<IRepository<ObjectType, Guid>>();

            var userStoreMock = new Mock<IUserStore<AppUser>>();
            _userManagerMock = new Mock<UserManager<AppUser>>(
                userStoreMock.Object,
                Options.Create(new IdentityOptions()),
                new Mock<IPasswordHasher<AppUser>>().Object,
                Array.Empty<IUserValidator<AppUser>>(),
                Array.Empty<IPasswordValidator<AppUser>>(),
                new Mock<ILookupNormalizer>().Object,
                new IdentityErrorDescriber(),
                new Mock<IServiceProvider>().Object,
                new Mock<ILogger<UserManager<AppUser>>>().Object
            );

            var roleStoreMock = new Mock<IRoleStore<AppRole>>();
            _roleManagerMock = new Mock<RoleManager<AppRole>>(
                roleStoreMock.Object,
                Array.Empty<IRoleValidator<AppRole>>(),
                new Mock<ILookupNormalizer>().Object,
                new IdentityErrorDescriber(),
                new Mock<ILogger<RoleManager<AppRole>>>().Object
            );

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

        [Fact]
        public async Task GetCustomerByUserIdAsync_WithValidUser_ReturnsDto()
        {
            var userId = Guid.NewGuid();
            var userIdString = userId.ToString();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Nguyen Van A",
                Email = "a@example.com",
                PhoneNumber = "0123456789",
                IsActive = true,
                DateCreated = DateTime.UtcNow,
                Homes = new List<Home> { new Home { IsDeleted = false } }
            };

            _userManagerMock.Setup(u => u.FindByIdAsync(userIdString)).ReturnsAsync(user);

            var objectType = new ObjectType { Id = Guid.NewGuid(), Name = "User" };
            var file = new HSP.Core.Entities.File { Id = Guid.NewGuid(), FilePath = "/avatars/a.png", IsDeleted = false };
            var relation = new FileRelation { Id = Guid.NewGuid(), ObjectId = userId, ObjectTypeId = objectType.Id, RelationType = "avatar", File = file, DateCreated = DateTime.UtcNow };


            var result = await _service.GetCustomerByUserIdAsync(userIdString);

            Assert.NotNull(result);
            Assert.Equal(user.Id, result.Id);
            Assert.Equal("/avatars/a.png", result.AvatarUrl);
        }

        [Fact]
        public async Task GetCustomerByUserIdAsync_WithInvalidGuid_ThrowsArgumentException()
        {
            await Assert.ThrowsAsync<ArgumentException>(() => _service.GetCustomerByUserIdAsync("not-a-guid"));
        }

        [Fact]
        public async Task GetCustomerByIdAsync_UserNotFound_ThrowsKeyNotFoundException()
        {
            var missingId = Guid.NewGuid();

            await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.GetCustomerByIdAsync(missingId));
        }

        [Fact]
        public async Task UpdateCustomerAsync_WithValidUser_UpdatesAndReturnsDto()
        {
            var userId = Guid.NewGuid();
            var userIdString = userId.ToString();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Old Name",
                PhoneNumber = "0123456789",
                IsActive = true,
                DateCreated = DateTime.UtcNow,
                Homes = new List<Home>()
            };

            var updateDto = new UpdateAppUserDto
            {
                FullName = "New Name",
                PhoneNumber = "0987654321"
            };

            _userManagerMock.Setup(u => u.FindByIdAsync(userIdString)).ReturnsAsync(user);
            _userManagerMock.Setup(u => u.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);

            var objectType = new ObjectType { Id = Guid.NewGuid(), Name = "User" };

            var result = await _service.UpdateCustomerAsync(userIdString, updateDto);

            Assert.NotNull(result);
            Assert.Equal("New Name", result.FullName);
            Assert.Equal("0987654321", result.PhoneNumber);
        }

        [Fact]
        public async Task RequestEmailChangeAsync_Success_SendsEmailAndReturnsSuccess()
        {
            var userId = Guid.NewGuid();
            var userIdString = userId.ToString();
            var newEmail = "new@example.com";

            var user = new AppUser
            {
                Id = userId,
                FullName = "User Test",
                Email = "old@example.com",
                UserName = "old@example.com"
            };

            _userManagerMock.Setup(u => u.FindByIdAsync(userIdString)).ReturnsAsync(user);
            _userManagerMock.Setup(u => u.FindByEmailAsync(newEmail)).ReturnsAsync((AppUser?)null);
            _userManagerMock.Setup(u => u.GenerateChangeEmailTokenAsync(user, newEmail)).ReturnsAsync("token123");

            _configurationMock.Setup(c => c[It.Is<string>(s => s == "UrlSettings:FrontendEmailChange")]).Returns("https://frontend/confirm");


            var result = await _service.RequestEmailChangeAsync(userIdString, newEmail);

            Assert.True(result.Success);
            Assert.Equal(newEmail, result.NewEmail);
        }

        [Fact]
        public async Task ConfirmEmailChangeAsync_Success_ChangesEmailAndReturnsSuccess()
        {
            var userId = Guid.NewGuid();
            var userIdString = userId.ToString();
            var newEmail = "confirm@example.com";
            var changeToken = "chgtoken";

            var tokenBytes = Encoding.UTF8.GetBytes($"{userIdString}:{newEmail}:{changeToken}");
            var base64Token = Convert.ToBase64String(tokenBytes);

            var user = new AppUser
            {
                Id = userId,
                Email = "old@example.com",
                UserName = "old@example.com"
            };

            _userManagerMock.Setup(u => u.FindByIdAsync(userIdString)).ReturnsAsync(user);
            _userManagerMock.Setup(u => u.FindByEmailAsync(newEmail)).ReturnsAsync((AppUser?)null);
            _userManagerMock.Setup(u => u.ChangeEmailAsync(user, newEmail, changeToken)).ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(u => u.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);

            var result = await _service.ConfirmEmailChangeAsync(userIdString, base64Token);

            Assert.True(result.Success);
            Assert.Equal(newEmail, result.NewEmail);
        }
    }
}