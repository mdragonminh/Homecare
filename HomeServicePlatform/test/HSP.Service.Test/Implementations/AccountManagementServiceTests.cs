using HSP.Core.Abstractions.DataAccess;
using HSP.Core.Constans;
using HSP.Core.Dtos.AccountDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;
using Moq;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Xunit;

namespace HSP.Service.Test.Implementations
{
    public class AccountManagementServiceTests
    {
        private readonly Mock<IUserRepository> _userRepo;
        private readonly Mock<IRoleRepository> _roleRepo;
        private readonly Mock<IUnitOfWork> _uow;
        private readonly Mock<IStringLocalizer<SharedResource>> _localizer;

        private readonly AccountManagementService _service;

        public AccountManagementServiceTests()
        {
            _userRepo = new Mock<IUserRepository>();
            _roleRepo = new Mock<IRoleRepository>();
            _uow = new Mock<IUnitOfWork>();
            _localizer = new Mock<IStringLocalizer<SharedResource>>();

            _service = new AccountManagementService(
                _userRepo.Object,
                _roleRepo.Object,
                _uow.Object,
                _localizer.Object
            );
        }
        [Fact]
        public async Task GetAccountsAsync_ShouldReturnOnlyManagementRoles()
        {
            // Arrange
            var users = new List<AppUser>
            {
                new AppUser { Id = Guid.NewGuid(), Email="admin@sys.com", FullName="Admin", UserName="admin", IsActive=true },
                new AppUser { Id = Guid.NewGuid(), Email="cus@sys.com", FullName="Cus", UserName="cus", IsActive=true }
            };

            _userRepo.Setup(r => r.GetAllUsersAsync()).ReturnsAsync(users);
            _userRepo.Setup(r => r.GetRolesAsync(It.IsAny<AppUser>()))
                .ReturnsAsync((AppUser u) =>
                {
                    if (u.Email.Contains("cus"))
                        return new List<string> { RoleNames.Customer };
                    return new List<string> { RoleNames.Operator };
                });

            var filter = new AccountFilterDto { PageNumber = 1, PageSize = 10 };

            // Act
            var result = await _service.GetAccountsAsync(filter);

            // Assert
            Assert.Single(result.Items);
            Assert.Equal("admin@sys.com", result.Items[0].Email);
        }
        [Fact]
        public async Task GetAccountByIdAsync_ShouldReturnNull_WhenInvalidId()
        {
            var result = await _service.GetAccountByIdAsync("abc");
            Assert.Null(result);
        }
        [Fact]
        public async Task CreateAccountAsync_ShouldThrow_WhenRoleInvalid()
        {
            var input = new CreateAccountRequestDto
            {
                Role = "RandomRole",
                Email = "test@mail.com",
                Username = "test",
                Password = "123",
                FullName = "A"
            };

            Assert.ThrowsAsync<ValidationException>(() =>
                _service.CreateAccountAsync(input, Guid.NewGuid().ToString()));
        }
        [Fact]
        public async Task CreateAccountAsync_ShouldThrow_WhenRoleNotExist()
        {
            var input = new CreateAccountRequestDto
            {
                Role = RoleNames.Operator,
                Email = "test@mail.com",
                Username = "test",
                Password = "123456"
            };

            _roleRepo.Setup(r => r.RoleExistsAsync(RoleNames.Operator))
                     .ReturnsAsync(false);

            await Assert.ThrowsAsync<ValidationException>(() =>
                _service.CreateAccountAsync(input, Guid.NewGuid().ToString()));
        }
        [Fact]
        public async Task CreateAccountAsync_ShouldThrow_WhenEmailExists()
        {
            var input = new CreateAccountRequestDto
            {
                Role = RoleNames.Operator,
                Email = "exist@mail.com",
                Username = "user",
                Password = "123456"
            };

            _roleRepo.Setup(r => r.RoleExistsAsync(RoleNames.Operator)).ReturnsAsync(true);
            _userRepo.Setup(r => r.FindByEmailAsync("exist@mail.com")).ReturnsAsync(new AppUser());

            await Assert.ThrowsAsync<ValidationException>(() =>
                _service.CreateAccountAsync(input, Guid.NewGuid().ToString()));
        }
        [Fact]
        public async Task UpdateAccountAsync_ShouldReturnFalse_WhenUserNotFound()
        {
            _userRepo.Setup(r => r.FindByIdAsync(It.IsAny<Guid>()))
                     .ReturnsAsync((AppUser)null);

            var result = await _service.UpdateAccountAsync(Guid.NewGuid().ToString(),
                new UpdateAccountRequestDto { FullName = "New Name" }, Guid.NewGuid().ToString());

            Assert.False(result);
        }
        [Fact]
        public async Task DisableAccountAsync_ShouldDisableUser()
        {
            var user = new AppUser { Id = Guid.NewGuid(), IsActive = true };

            _userRepo.Setup(r => r.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepo.Setup(r => r.UpdateAccount(user))
                     .ReturnsAsync(IdentityResult.Success);

            var dto = new DisableAccountRequestDto { Reason = "Test" };

            var result = await _service.DisableAccountAsync(user.Id.ToString(), dto, Guid.NewGuid().ToString());

            Assert.True(result);
            Assert.False(user.IsActive);
            Assert.NotNull(user.DisabledAt);
        }
        [Fact]
        public async Task EnableAccountAsync_ShouldEnableUser()
        {
            var user = new AppUser { Id = Guid.NewGuid(), IsActive = false };

            _userRepo.Setup(r => r.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepo.Setup(r => r.UpdateAccount(user))
                     .ReturnsAsync(IdentityResult.Success);

            var result = await _service.EnableAccountAsync(user.Id.ToString(), Guid.NewGuid().ToString());

            Assert.True(result);
            Assert.True(user.IsActive);
        }
    }
}