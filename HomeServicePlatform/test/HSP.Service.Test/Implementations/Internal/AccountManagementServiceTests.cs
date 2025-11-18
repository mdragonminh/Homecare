using HSP.Core.Abstractions.DataAccess;
using HSP.Core.Constans;
using HSP.Core.Dtos.AccountDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations.Internal;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Localization;
using Moq;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace HSP.Service.Test.Implementations.Internal
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

            // Simple localizer setup that returns the key (helps for ValidationException messages)
            _localizer.Setup(l => l[It.IsAny<string>()])
                      .Returns((string k) => new LocalizedString(k, k));
            _localizer.Setup(l => l[It.IsAny<string>(), It.IsAny<object[]>()])
                      .Returns((string k, object[] args) => new LocalizedString(k, string.Format(k, args)));

            _service = new AccountManagementService(
                _userRepo.Object,
                _roleRepo.Object,
                _uow.Object,
                _localizer.Object
            );
        }

        #region GetAccountsAsync

        [Fact]
        public async Task GetAccountsAsync_ShouldFilterBySearchTerm_Email_Username_FullName()
        {
            // Arrange
            var users = new List<AppUser>
            {
                new AppUser { Id = Guid.NewGuid(), Email = "match@email.com", UserName = "nomatch", FullName="NoMatch"},
                new AppUser { Id = Guid.NewGuid(), Email = "a@b.com", UserName = "matchusername", FullName="NoMatch"},
                new AppUser { Id = Guid.NewGuid(), Email = "c@d.com", UserName = "u", FullName="matching fullname"}
            };

            _userRepo.Setup(r => r.GetAllUsersAsync()).ReturnsAsync(users);
            _userRepo.Setup(r => r.GetRolesAsync(It.IsAny<AppUser>())).ReturnsAsync(new List<string> { RoleNames.Operator });

            var filter = new AccountFilterDto
            {
                PageNumber = 1,
                PageSize = 10,
                SearchTerm = "match"
            };

            // Act
            var result = await _service.GetAccountsAsync(filter);

            // Assert -> all 3 contain 'match' in either email/username/fullname
            Assert.Equal(3, result.TotalCount);
        }

        [Fact]
        public async Task GetAccountsAsync_ShouldApplyIsActiveDepartmentAndRoleFilters()
        {
            // Arrange
            var u1 = new AppUser { Id = Guid.NewGuid(), Email = "1", UserName = "1", FullName = "1", IsActive = true, Department = "IT" };
            var u2 = new AppUser { Id = Guid.NewGuid(), Email = "2", UserName = "2", FullName = "2", IsActive = false, Department = "Sales" };
            var u3 = new AppUser { Id = Guid.NewGuid(), Email = "3", UserName = "3", FullName = "3", IsActive = true, Department = "IT" };

            var users = new List<AppUser> { u1, u2, u3 };

            _userRepo.Setup(r => r.GetAllUsersAsync()).ReturnsAsync(users);

            _userRepo.Setup(r => r.GetRolesAsync(It.IsAny<AppUser>()))
                .ReturnsAsync((AppUser u) =>
                {
                    if (u == u1) return new List<string> { RoleNames.Operator };
                    if (u == u2) return new List<string> { RoleNames.Operator };
                    return new List<string> { RoleNames.Supporter };
                });

            var filter = new AccountFilterDto
            {
                PageNumber = 1,
                PageSize = 10,
                IsActive = true,
                Department = "IT",
                Role = RoleNames.Supporter
            };

            // Act
            var result = await _service.GetAccountsAsync(filter);

            // Only u3 matches (IsActive true, Department IT, Role Supporter)
            Assert.Single(result.Items);
            Assert.Equal(u3.Email, result.Items[0].Email);
        }

        #endregion

        #region GetAccountByIdAsync

        [Fact]
        public async Task GetAccountByIdAsync_ShouldReturnNull_WhenInvalidGuid()
        {
            var result = await _service.GetAccountByIdAsync("not-a-guid");
            Assert.Null(result);
        }

        [Fact]
        public async Task GetAccountByIdAsync_ShouldReturnNull_WhenUserNotFound()
        {
            _userRepo.Setup(r => r.FindByIdAsync(It.IsAny<Guid>())).ReturnsAsync((AppUser)null);
            var result = await _service.GetAccountByIdAsync(Guid.NewGuid().ToString());
            Assert.Null(result);
        }

        [Fact]
        public async Task GetAccountByIdAsync_ShouldReturnAccount_WhenFound()
        {
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "a@b.com",
                UserName = "u1",
                FullName = "User 1",
                PhoneNumber = "0123",
                Department = "IT",
                IsActive = true,
                EmailConfirmed = true,
                DateCreated = DateTime.UtcNow,
                CreatedBy = Guid.NewGuid()
            };

            _userRepo.Setup(r => r.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepo.Setup(r => r.GetRolesAsync(user)).ReturnsAsync(new List<string> { RoleNames.Operator });

            var dto = await _service.GetAccountByIdAsync(user.Id.ToString());

            Assert.NotNull(dto);
            Assert.Equal(user.Email, dto.Email);
            Assert.Equal(RoleNames.Operator, dto.Role);
        }

        #endregion

        #region CreateAccountAsync

        [Fact]
        public async Task CreateAccountAsync_ShouldThrow_WhenRoleIsNotInValidList()
        {
            var input = new CreateAccountRequestDto
            {
                Role = "Random",
                Email = "x@y.com",
                Username = "u",
                Password = "P@ssw0rd"
            };

            await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAccountAsync(input, Guid.NewGuid().ToString()));
        }

        [Fact]
        public async Task CreateAccountAsync_ShouldThrow_WhenRoleDoesNotExistInRepo()
        {
            var input = new CreateAccountRequestDto
            {
                Role = RoleNames.Operator,
                Email = "x@y.com",
                Username = "u",
                Password = "P@ssw0rd"
            };

            _roleRepo.Setup(r => r.RoleExistsAsync(RoleNames.Operator)).ReturnsAsync(false);

            await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAccountAsync(input, Guid.NewGuid().ToString()));
        }

        [Fact]
        public async Task CreateAccountAsync_ShouldThrow_WhenEmailExists()
        {
            var input = new CreateAccountRequestDto
            {
                Role = RoleNames.Operator,
                Email = "dup@mail.com",
                Username = "u",
                Password = "P@ssw0rd"
            };

            _roleRepo.Setup(r => r.RoleExistsAsync(RoleNames.Operator)).ReturnsAsync(true);
            _userRepo.Setup(r => r.FindByEmailAsync(input.Email)).ReturnsAsync(new AppUser());

            await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAccountAsync(input, Guid.NewGuid().ToString()));
        }

        [Fact]
        public async Task CreateAccountAsync_ShouldThrow_WhenUsernameExists()
        {
            var input = new CreateAccountRequestDto
            {
                Role = RoleNames.Operator,
                Email = "new@mail.com",
                Username = "dupUser",
                Password = "P@ssw0rd"
            };

            _roleRepo.Setup(r => r.RoleExistsAsync(RoleNames.Operator)).ReturnsAsync(true);
            _userRepo.Setup(r => r.FindByEmailAsync(input.Email)).ReturnsAsync((AppUser)null);
            _userRepo.Setup(r => r.FindByNameAsync(input.Username)).ReturnsAsync(new AppUser());

            await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAccountAsync(input, Guid.NewGuid().ToString()));
        }

        [Fact]
        public async Task CreateAccountAsync_ShouldThrow_WhenCreateAsyncReturnsInvalidUserNameError()
        {
            var input = new CreateAccountRequestDto
            {
                Role = RoleNames.Operator,
                Email = "a@mail.com",
                Username = "bad*name",
                Password = "P@ssw0rd"
            };

            _roleRepo.Setup(r => r.RoleExistsAsync(RoleNames.Operator)).ReturnsAsync(true);
            _userRepo.Setup(r => r.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((AppUser)null);
            _userRepo.Setup(r => r.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((AppUser)null);

            var identityResult = IdentityResult.Failed(new IdentityError { Code = "InvalidUserName", Description = "Invalid" });
            _userRepo.Setup(r => r.CreateAsync(It.IsAny<AppUser>(), input.Password)).ReturnsAsync(identityResult);

            var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAccountAsync(input, Guid.NewGuid().ToString()));
            Assert.Contains("username:", ex.Message);
        }

        [Fact]
        public async Task CreateAccountAsync_ShouldThrow_WhenCreateAsyncReturnsPasswordError()
        {
            var input = new CreateAccountRequestDto
            {
                Role = RoleNames.Operator,
                Email = "a@mail.com",
                Username = "user",
                Password = "weak"
            };

            _roleRepo.Setup(r => r.RoleExistsAsync(RoleNames.Operator)).ReturnsAsync(true);
            _userRepo.Setup(r => r.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((AppUser)null);
            _userRepo.Setup(r => r.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((AppUser)null);

            var identityResult = IdentityResult.Failed(new IdentityError { Code = "PasswordTooShort", Description = "Too short" });
            _userRepo.Setup(r => r.CreateAsync(It.IsAny<AppUser>(), input.Password)).ReturnsAsync(identityResult);

            var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAccountAsync(input, Guid.NewGuid().ToString()));
            Assert.Contains("password:", ex.Message);
        }

        [Fact]
        public async Task CreateAccountAsync_ShouldThrow_WhenCreateAsyncFailsWithOtherErrors()
        {
            var input = new CreateAccountRequestDto
            {
                Role = RoleNames.Operator,
                Email = "a@mail.com",
                Username = "user",
                Password = "GoodP@ss1"
            };

            _roleRepo.Setup(r => r.RoleExistsAsync(RoleNames.Operator)).ReturnsAsync(true);
            _userRepo.Setup(r => r.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((AppUser)null);
            _userRepo.Setup(r => r.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((AppUser)null);

            var identityResult = IdentityResult.Failed(new IdentityError { Code = "Other", Description = "something wrong" });
            _userRepo.Setup(r => r.CreateAsync(It.IsAny<AppUser>(), input.Password)).ReturnsAsync(identityResult);

            var ex = await Assert.ThrowsAsync<ValidationException>(() => _service.CreateAccountAsync(input, Guid.NewGuid().ToString()));
            Assert.Contains("FailedToCreateAccount", ex.Message); // localized key used as message by our localizer stub
        }


        [Fact]
        public async Task CreateAccountAsync_ShouldReturnUserId_WhenSuccess()
        {
            var input = new CreateAccountRequestDto
            {
                Role = RoleNames.Operator,
                Email = "ok@mail.com",
                Username = "okuser",
                Password = "GoodP@ss1"
            };

            _roleRepo.Setup(r => r.RoleExistsAsync(RoleNames.Operator)).ReturnsAsync(true);
            _userRepo.Setup(r => r.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((AppUser)null);
            _userRepo.Setup(r => r.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((AppUser)null);

            // Capture the created user so we can assert the returned ID is a guid string
            AppUser? createdUser = null;
            _userRepo.Setup(r => r.CreateAsync(It.IsAny<AppUser>(), input.Password))
                .Callback((AppUser u, string pwd) =>
                {
                    createdUser = u;
                    createdUser.Id = Guid.NewGuid();
                })
                .ReturnsAsync(IdentityResult.Success);

            _userRepo.Setup(r => r.AddToRoleAsync(It.IsAny<AppUser>(), input.Role))
                     .ReturnsAsync(IdentityResult.Success);

            var result = await _service.CreateAccountAsync(input, Guid.NewGuid().ToString());

            Assert.True(Guid.TryParse(result, out var parsed));
            Assert.Equal(createdUser!.Id.ToString(), result);
        }

        #endregion

        #region UpdateAccountAsync

        [Fact]
        public async Task UpdateAccountAsync_ShouldReturnFalse_WhenAccountIdInvalid()
        {
            var result = await _service.UpdateAccountAsync("not-a-guid", new UpdateAccountRequestDto(), Guid.NewGuid().ToString());
            Assert.False(result);
        }

        [Fact]
        public async Task UpdateAccountAsync_ShouldReturnFalse_WhenUserNotFound()
        {
            _userRepo.Setup(r => r.FindByIdAsync(It.IsAny<Guid>())).ReturnsAsync((AppUser)null);
            var result = await _service.UpdateAccountAsync(Guid.NewGuid().ToString(), new UpdateAccountRequestDto { FullName = "X" }, Guid.NewGuid().ToString());
            Assert.False(result);
        }

        [Fact]
        public async Task UpdateAccountAsync_ShouldReturnTrue_WhenNoChanges()
        {
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                FullName = "Same",
                PhoneNumber = "111",
                Department = "IT",
                IsActive = true
            };

            _userRepo.Setup(r => r.FindByIdAsync(user.Id)).ReturnsAsync(user);

            var result = await _service.UpdateAccountAsync(user.Id.ToString(), new UpdateAccountRequestDto(), Guid.NewGuid().ToString());
            Assert.True(result);
            _userRepo.Verify(u => u.UpdateAccount(It.IsAny<AppUser>()), Times.Never);
        }

        [Fact]
        public async Task UpdateAccountAsync_ShouldCallUpdateAccount_WhenChangesPresent_AndReturnTrueOnSuccess()
        {
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                FullName = "Old",
                PhoneNumber = "000",
                Department = "IT",
                IsActive = true
            };

            _userRepo.Setup(r => r.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepo.Setup(r => r.UpdateAccount(It.IsAny<AppUser>())).ReturnsAsync(IdentityResult.Success);

            var input = new UpdateAccountRequestDto
            {
                FullName = "New",
                PhoneNumber = "999",
                Department = "HR",
                IsActive = false
            };

            var ok = await _service.UpdateAccountAsync(user.Id.ToString(), input, Guid.NewGuid().ToString());
            Assert.True(ok);
            _userRepo.Verify(u => u.UpdateAccount(It.Is<AppUser>(a => a.FullName == "New" && a.PhoneNumber == "999" && a.Department == "HR" && a.IsActive == false)), Times.Once);
        }

        [Fact]
        public async Task UpdateAccountAsync_ShouldReturnFalse_WhenUpdateAccountFails()
        {
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                FullName = "Old"
            };

            _userRepo.Setup(r => r.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepo.Setup(r => r.UpdateAccount(It.IsAny<AppUser>())).ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "fail" }));

            var input = new UpdateAccountRequestDto { FullName = "New" };
            var ok = await _service.UpdateAccountAsync(user.Id.ToString(), input, Guid.NewGuid().ToString());
            Assert.False(ok);
        }

        #endregion

        #region Disable/Enable/Delete

        [Fact]
        public async Task DisableAccountAsync_ShouldReturnFalse_WhenIdInvalid()
        {
            var result = await _service.DisableAccountAsync("bad", new DisableAccountRequestDto { Reason = "x" }, Guid.NewGuid().ToString());
            Assert.False(result);
        }

        [Fact]
        public async Task DisableAccountAsync_ShouldReturnFalse_WhenUserNotFound()
        {
            _userRepo.Setup(r => r.FindByIdAsync(It.IsAny<Guid>())).ReturnsAsync((AppUser)null);
            var result = await _service.DisableAccountAsync(Guid.NewGuid().ToString(), new DisableAccountRequestDto { Reason = "x" }, Guid.NewGuid().ToString());
            Assert.False(result);
        }

        [Fact]
        public async Task DisableAccountAsync_ShouldDisableAndReturnTrue_OnSuccess()
        {
            var user = new AppUser { Id = Guid.NewGuid(), IsActive = true };
            _userRepo.Setup(r => r.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepo.Setup(r => r.UpdateAccount(It.IsAny<AppUser>())).ReturnsAsync(IdentityResult.Success);

            var result = await _service.DisableAccountAsync(user.Id.ToString(), new DisableAccountRequestDto { Reason = "test" }, Guid.NewGuid().ToString());

            Assert.True(result);
            Assert.False(user.IsActive);
            Assert.NotNull(user.DisabledAt);
            Assert.Equal("test", user.DisabledReason);
        }

        [Fact]
        public async Task EnableAccountAsync_ShouldReturnFalse_WhenIdInvalid()
        {
            var result = await _service.EnableAccountAsync("bad", Guid.NewGuid().ToString());
            Assert.False(result);
        }

        [Fact]
        public async Task EnableAccountAsync_ShouldReturnFalse_WhenUserNotFound()
        {
            _userRepo.Setup(r => r.FindByIdAsync(It.IsAny<Guid>())).ReturnsAsync((AppUser)null);
            var result = await _service.EnableAccountAsync(Guid.NewGuid().ToString(), Guid.NewGuid().ToString());
            Assert.False(result);
        }

        [Fact]
        public async Task EnableAccountAsync_ShouldEnableAndReturnTrue_OnSuccess()
        {
            var user = new AppUser { Id = Guid.NewGuid(), IsActive = false, DisabledReason = "x", DisabledAt = DateTime.UtcNow.AddDays(-1) };
            _userRepo.Setup(r => r.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepo.Setup(r => r.UpdateAccount(It.IsAny<AppUser>())).ReturnsAsync(IdentityResult.Success);

            var result = await _service.EnableAccountAsync(user.Id.ToString(), Guid.NewGuid().ToString());

            Assert.True(result);
            Assert.True(user.IsActive);
            Assert.Null(user.DisabledReason);
            Assert.Null(user.DisabledAt);
        }

        [Fact]
        public async Task DeleteAccountAsync_ShouldReturnFalse_WhenIdInvalid()
        {
            var result = await _service.DeleteAccountAsync("bad", Guid.NewGuid().ToString());
            Assert.False(result);
        }

        [Fact]
        public async Task DeleteAccountAsync_ShouldReturnFalse_WhenUserNotFound()
        {
            _userRepo.Setup(r => r.FindByIdAsync(It.IsAny<Guid>())).ReturnsAsync((AppUser)null);
            var result = await _service.DeleteAccountAsync(Guid.NewGuid().ToString(), Guid.NewGuid().ToString());
            Assert.False(result);
        }

        [Fact]
        public async Task DeleteAccountAsync_ShouldSoftDeleteAndReturnTrue_OnSuccess()
        {
            var user = new AppUser { Id = Guid.NewGuid(), IsActive = true };
            _userRepo.Setup(r => r.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepo.Setup(r => r.UpdateAccount(It.IsAny<AppUser>())).ReturnsAsync(IdentityResult.Success);

            var result = await _service.DeleteAccountAsync(user.Id.ToString(), Guid.NewGuid().ToString());

            Assert.True(result);
            Assert.False(user.IsActive);
            Assert.Equal("Account deleted by administrator", user.DisabledReason);
            Assert.NotNull(user.DisabledAt);
        }

        #endregion

        #region GetAccountsByRoleAsync

        [Fact]
        public async Task GetAccountsByRoleAsync_ShouldReturnEmpty_WhenNoUsers()
        {
            _userRepo.Setup(r => r.GetUsersInRoleAsync("Operator")).ReturnsAsync(new List<AppUser>());
            var result = await _service.GetAccountsByRoleAsync("Operator");
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetAccountsByRoleAsync_ShouldReturnMappedAccounts()
        {
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "a@b.com",
                UserName = "u",
                FullName = "User",
                PhoneNumber = "012",
                Department = "IT",
                IsActive = true,
                EmailConfirmed = true,
                DateCreated = DateTime.UtcNow,
                CreatedBy = Guid.NewGuid()
            };

            _userRepo.Setup(r => r.GetUsersInRoleAsync(RoleNames.Operator)).ReturnsAsync(new List<AppUser> { user });

            var result = await _service.GetAccountsByRoleAsync(RoleNames.Operator);
            var list = result.ToList();

            Assert.Single(list);
            Assert.Equal(user.Email, list[0].Email);
            Assert.Equal(RoleNames.Operator, list[0].Role);
        }

        #endregion
    }
}
