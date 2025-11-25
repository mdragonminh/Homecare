using HSP.Core.Constans;
using HSP.Core.Dtos.AppUserDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Implementations.Internal;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xunit;



namespace HSP.Service.Test.Implementations.Internal
{

    public class CustomerProfileServiceTests
    {
        private readonly Mock<RoleManager<AppRole>> _roleManagerMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly Mock<IRepository<Core.Entities.File, Guid>> _fileRepoMock;
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
            _fileRepoMock = new Mock<IRepository<Core.Entities.File, Guid>>();
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

        private static Mock<RoleManager<AppRole>> MockRoleManager()
        {
            var store = new Mock<IRoleStore<AppRole>>();

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
            string validId = Guid.NewGuid().ToString();

            var emptyListMock = new List<AppUser>().BuildMock();

            _userRepoMock.Setup(x => x.GetUsersAsQueryable())
                         .Returns(emptyListMock);

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.GetCustomerByUserIdAsync(validId));
        }


        [Fact]
        public async Task GetCustomerByUserIdAsync_ShouldReturnUser_WhenUserExists()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Nguyen Van A",
                Email = "a@example.com",
                PhoneNumber = "0123456789",
                IsActive = true,
                DateCreated = DateTime.UtcNow.AddDays(-10),
                DateModified = DateTime.UtcNow.AddDays(-5),
                Homes = new List<Home> { new Home { Id = Guid.NewGuid(), IsDeleted = false } }
            };

            var usersList = new List<AppUser> { user };
            var mockUsers = usersList.BuildMock();

            _userRepoMock.Setup(r => r.GetUsersAsQueryable()).Returns(mockUsers);

            var objectTypes = new List<ObjectType>
            {
                new ObjectType { Id = Guid.NewGuid(), Name = "User" }
            };
            var objectTypesMock = objectTypes.BuildMock();
            _objTypeRepoMock.Setup(r => r.GetAll())
                           .Returns(objectTypesMock);

            var fileRelations = new List<FileRelation>();
            var fileRelationsMock = fileRelations.BuildMock();
            _fileRelRepoMock.Setup(r => r.GetAll())
                           .Returns(fileRelationsMock);

            var result = await _service.GetCustomerByUserIdAsync(userId.ToString());

            Assert.NotNull(result);
            Assert.Equal(userId, result.Id);
            Assert.Equal("Nguyen Van A", result.FullName);
            Assert.Equal("a@example.com", result.Email);
            Assert.Equal("0123456789", result.PhoneNumber);
            Assert.True(result.IsActive);
            Assert.Equal(1, result.TotalHomes);

            _userRepoMock.Verify(r => r.GetUsersAsQueryable(), Times.Once);
        }



        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnError_WhenInvalidUserId()
        {
            var result = await _service.RequestEmailChangeAsync("not-guid", "long@gmail.com");
            Assert.False(result.Success);
            Assert.Contains("User ID", result.Message);
        }

        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnError_WhenUserNotFound()
        {
            string userId = Guid.NewGuid().ToString();
            _userRepoMock.Setup(x => x.FindByIdAsync(It.IsAny<Guid>())).ReturnsAsync((AppUser?)null);

            var result = await _service.RequestEmailChangeAsync(userId, "long@gmail.com");

            Assert.False(result.Success);
            Assert.Contains("Không tìm thấy người dùng", result.Message);
        }

        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnSuccess_WhenValid()
        {
            var user = new AppUser { Id = Guid.NewGuid(), Email = "thanhlongnguyen@gmail.com", FullName = "Nguyen Thanh Long" };
            string newEmail = "long@gmail.com";

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



        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldReturnError_WhenInvalidToken()
        {
            var result = await _service.ConfirmEmailChangeAsync(Guid.NewGuid().ToString(), "INVALID_BASE64");

            Assert.False(result.Success);
            Assert.Contains("Lỗi khi xác nhận", result.Message);
        }

        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnError_WhenNewEmailSameAsOld()
        {
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "thanhlongnguyen@gmail.com",
                FullName = "Nguyen Thanh Long"
            };

            _userRepoMock.Setup(x => x.FindByIdAsync(user.Id)).ReturnsAsync(user);

            var result = await _service.RequestEmailChangeAsync(user.Id.ToString(), "thanhlongnguyen@gmail.com");

            Assert.False(result.Success);
            Assert.Contains("Email mới không được trùng với email hiện tại", result.Message);
        }

        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnError_WhenNewEmailAlreadyExists()
        {
            var user = new AppUser
            {

                Id = Guid.NewGuid(),
                Email = "thanhlongnguyen@gmail.com",
                FullName = "Nguyen Thanh Long"
            };

            var existingUser = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "thanhlong@gmail.com"
            };

            _userRepoMock.Setup(x => x.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepoMock.Setup(x => x.FindByEmailAsync("thanhlong@gmail.com")).ReturnsAsync(existingUser);

            var result = await _service.RequestEmailChangeAsync(user.Id.ToString(), "thanhlong@gmail.com");

            Assert.False(result.Success);
            Assert.Contains("Email này đã được sử dụng bởi tài khoản khác", result.Message);
        }


        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldReturnSuccess_WhenTokenValid()
        {
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "old@example.com",
                FullName = "John Doe",
                UserName = "old@example.com"
            };

            string newEmail = "new@example.com";
            string fakeToken = "VALID_TOKEN";

            string tokenString = $"{user.Id}:{newEmail}:{fakeToken}";
            string base64Token = Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenString));

            _userRepoMock.Setup(x => x.FindByIdAsync(user.Id))
                         .ReturnsAsync(user);

            _userRepoMock.Setup(x => x.FindByEmailAsync(newEmail))
                         .ReturnsAsync((AppUser?)null);

            _userRepoMock.Setup(x => x.ChangeEmailAsync(user, newEmail, fakeToken))
                         .ReturnsAsync(IdentityResult.Success);

            _userRepoMock.Setup(x => x.UpdateAccount(It.IsAny<AppUser>()))
                         .ReturnsAsync(IdentityResult.Success);

            var result = await _service.ConfirmEmailChangeAsync(user.Id.ToString(), base64Token);

            Assert.True(result.Success);
            Assert.Equal("Email đã được thay đổi thành công", result.Message);
            Assert.Equal(newEmail, result.NewEmail);
        }



        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldReturnError_WhenChangeEmailFails()
        {
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

            var result = await _service.ConfirmEmailChangeAsync(user.Id.ToString(), base64Token);

            Assert.False(result.Success);
            Assert.Contains("Không thể thay đổi email", result.Message);
        }

        [Fact]
        public async Task GetCustomerByUserIdAsync_ShouldThrow_WhenUserInactive()
        {
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

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.GetCustomerByUserIdAsync(userId.ToString()));
        }


        [Fact]
        public async Task RequestEmailChangeAsync_ShouldReturnError_WhenSendEmailFails()
        {
            var user = new AppUser { Id = Guid.NewGuid(), Email = "thanhlongnguyen@gmail.com", FullName = "Nguyen Thanh Long" };
            _userRepoMock.Setup(x => x.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepoMock.Setup(x => x.FindByEmailAsync("long@gmail.com")).ReturnsAsync((AppUser?)null);
            _userRepoMock.Setup(x => x.GenerateChangeEmailTokenAsync(user, "thanhlong@gmail.com")).ReturnsAsync("FAKE_TOKEN");
            _configMock.Setup(x => x["UrlSettings:FrontendEmailChange"]).Returns("https://example.com/confirm");

            _emailServiceMock.Setup(x => x.SendEmailAsync(It.IsAny<EmailDto>()))
                             .ThrowsAsync(new Exception("SMTP error"));

            var result = await _service.RequestEmailChangeAsync(user.Id.ToString(), "thanhlong@gmail.com");

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

        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldReturnError_WhenTokenPartsNotThree()
        {
            var userId = Guid.NewGuid().ToString();
            string invalidToken = Convert.ToBase64String(Encoding.UTF8.GetBytes("only_two_parts"));

            var result = await _service.ConfirmEmailChangeAsync(userId, invalidToken);

            Assert.False(result.Success);
            Assert.Contains("Token không hợp lệ", result.Message);
        }

        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldReturnError_WhenTokenUserIdDoesNotMatch()
        {
            var userId = Guid.NewGuid().ToString();
            var wrongUserIdInToken = Guid.NewGuid().ToString();
            string tokenString = $"{wrongUserIdInToken}:newemail@example.com:FAKE_TOKEN";
            string base64Token = Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenString));

            var result = await _service.ConfirmEmailChangeAsync(userId, base64Token);

            Assert.False(result.Success);
            Assert.Contains("Token không khớp với người dùng", result.Message);
        }

        [Fact]
        public async Task ConfirmEmailChangeAsync_ShouldReturnError_WhenUserIdInvalidGuid()
        {
            string invalidUserId = "not-a-guid";
            string tokenString = $"{invalidUserId}:newemail@example.com:FAKE_TOKEN";
            string base64Token = Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenString));

            var result = await _service.ConfirmEmailChangeAsync(invalidUserId, base64Token);

            Assert.False(result.Success);
            Assert.Contains("User ID không hợp lệ", result.Message);
        }



        [Fact]
        public async Task UpdateCustomerAsync_ShouldThrow_WhenInvalidUserId()
        {
            string invalidUserId = "not-a-guid";
            var updateDto = new UpdateAppUserDto {FullName = "Thanh Long Nguyen", PhoneNumber = "0973775247" };

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.UpdateCustomerAsync(invalidUserId, updateDto));
        }

        [Fact]
        public async Task UpdateCustomerAsync_ShouldThrow_WhenUserNotFound()
        {
            string validUserId = Guid.NewGuid().ToString();
            var updateDto = new UpdateAppUserDto { FullName = "Thanh Long Nguyen", PhoneNumber = "0973775247" };

            _userRepoMock.Setup(r => r.FindByIdAsync(It.IsAny<Guid>()))
                         .ReturnsAsync((AppUser?)null);

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.UpdateCustomerAsync(validUserId, updateDto));
        }

        [Fact]
        public async Task UpdateCustomerAsync_ShouldThrow_WhenUpdateFails()
        {
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                FullName = "Nguyen Thanh Long", 
                PhoneNumber = "0979735203",  
            };

            var updateDto = new UpdateAppUserDto
            {
                FullName = "Thanh Long Nguyen",
                PhoneNumber = "0973775247" 
            };

            _userRepoMock.Setup(r => r.FindByIdAsync(user.Id)).ReturnsAsync(user);
            _userRepoMock.Setup(r => r.UpdateAccount(user))
                         .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "DB error" }));

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.UpdateCustomerAsync(user.Id.ToString(), updateDto));

            Assert.Contains("Failed to update user", ex.Message);
        }

        [Fact]
        public async Task UpdateCustomerAsync_ShouldReturnUpdatedUser_WhenSuccess()
        {
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Nguyen Thanh Long",
                PhoneNumber = "0979735203", 
                Email = "thanhlongnguyenn198@gmail.com",
                IsActive = true,
                DateCreated = DateTime.UtcNow.AddDays(-10),
                DateModified = DateTime.UtcNow.AddDays(-5),
                Homes = new List<Home>
                {
                    new Home { Id = Guid.NewGuid(), IsDeleted = false }
                }
            };
            var updateDto = new UpdateAppUserDto
            {
                FullName = "Thanh Long Nguyen",
                PhoneNumber = "0973775247" 
            };

            _userRepoMock.Setup(r => r.FindByIdAsync(userId))
                         .ReturnsAsync(user);

            _userRepoMock.Setup(r => r.UpdateAccount(It.IsAny<AppUser>()))
                         .ReturnsAsync(IdentityResult.Success);

            var usersList = new List<AppUser> { user };
            var usersMock = usersList.BuildMock();
            _userRepoMock.Setup(r => r.GetUsersAsQueryable())
                         .Returns(usersMock);

            var objectTypes = new List<ObjectType>
            {
                new ObjectType { Id = Guid.NewGuid(), Name = "User" }
            };
            var objectTypesMock = objectTypes.BuildMock();
            _objTypeRepoMock.Setup(r => r.GetAll())
                           .Returns(objectTypesMock);

            var fileRelations = new List<FileRelation>();
            var fileRelationsMock = fileRelations.BuildMock();
            _fileRelRepoMock.Setup(r => r.GetAll())
                           .Returns(fileRelationsMock);

            var result = await _service.UpdateCustomerAsync(userId.ToString(), updateDto);

            Assert.NotNull(result);
            Assert.Equal(userId, result.Id);
            Assert.Equal("Thanh Long Nguyen", result.FullName);
            Assert.Equal("0973775247", result.PhoneNumber); 
            Assert.Equal("thanhlongnguyenn198@gmail.com", result.Email);
            Assert.True(result.IsActive);
            Assert.Equal(1, result.TotalHomes);

            _userRepoMock.Verify(r => r.FindByIdAsync(userId), Times.Once);
            _userRepoMock.Verify(r => r.UpdateAccount(It.Is<AppUser>(u =>
                u.Id == userId &&
                u.FullName == "Thanh Long Nguyen" &&
                u.PhoneNumber == "0973775247")), Times.Once);
            _userRepoMock.Verify(r => r.GetUsersAsQueryable(), Times.Once);

        }


        [Fact]
        public async Task GetCustomersAsync_ShouldReturnEmpty_WhenCustomerRoleNotFound()
        {
            _roleManagerMock.Setup(r => r.FindByNameAsync("Customer"))
                            .ReturnsAsync((AppRole?)null);

            var result = await _service.GetCustomersAsync();

            Assert.NotNull(result);
            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalCount);
        }

        [Fact]
        public async Task GetCustomersAsync_ShouldReturnPagedCustomers_WhenRoleExists()
        {
            var customerRole = new AppRole { Name = "Customer" };
            _roleManagerMock.Setup(r => r.FindByNameAsync("Customer"))
                            .ReturnsAsync(customerRole);

            var user1 = new AppUser
            {
                Id = Guid.NewGuid(),
                FullName = "Nguyen Van A",
                Email = "a@example.com",
                PhoneNumber = "0123456789",
                IsActive = true,
                DateCreated = DateTime.UtcNow.AddDays(-2),
                Homes = new List<Home> { new Home { Id = Guid.NewGuid(), IsDeleted = false } }
            };
            var user2 = new AppUser
            {
                Id = Guid.NewGuid(),
                FullName = "Nguyen Van B",
                Email = "b@example.com",
                PhoneNumber = "0987654321",
                IsActive = true,
                DateCreated = DateTime.UtcNow.AddDays(-1),
                Homes = new List<Home>()
            };

            var users = new List<AppUser> { user1, user2 };
            var usersMock = users.BuildMock();
            _userRepoMock.Setup(r => r.GetUsersAsQueryable()).Returns(usersMock);

            _userRepoMock.Setup(r => r.GetUsersInRoleAsync("Customer"))
                         .ReturnsAsync(users);

            _fileRelRepoMock.Setup(r => r.GetAll()).Returns(new List<FileRelation>().BuildMock());
            _objTypeRepoMock.Setup(r => r.GetAll()).Returns(new List<ObjectType>().BuildMock());

            var result = await _service.GetCustomersAsync(pageNumber: 1, pageSize: 10);

            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Contains(result.Items, u => u.FullName == "Nguyen Van A");
            Assert.Contains(result.Items, u => u.FullName == "Nguyen Van B");
            Assert.Equal(1, result.Items.First(u => u.Id == user1.Id).TotalHomes);
            Assert.Equal(0, result.Items.First(u => u.Id == user2.Id).TotalHomes);
        }


        [Fact]
        public async Task GetDebugInfoAsync_ShouldReturnError_WhenCustomerRoleNotFound()
        {
            _roleManagerMock.Setup(r => r.FindByNameAsync("Customer"))
                            .ReturnsAsync((AppRole?)null);

            var result = await _service.GetDebugInfoAsync();

            Assert.NotNull(result);

            var resultType = result.GetType();
            var error = resultType.GetProperty("Error")!.GetValue(result);
            var totalCustomers = resultType.GetProperty("TotalCustomers")!.GetValue(result);
            var customers = resultType.GetProperty("Customers")!.GetValue(result) as IEnumerable<object>;

            Assert.Equal("Customer role not found", error);
            Assert.Equal(0, totalCustomers);
            Assert.NotNull(customers);
            Assert.Empty(customers!);
        }


        [Fact]
        public async Task GetDebugInfoAsync_ShouldReturnActiveCustomers_WhenRoleExists()
        {
            var customerRole = new AppRole { Name = "Customer" };
            _roleManagerMock.Setup(r => r.FindByNameAsync("Customer")).ReturnsAsync(customerRole);

            var activeUser = new AppUser
            {
                Id = Guid.NewGuid(),
                FullName = "Active User",
                Email = "active@example.com",
                IsActive = true,
                DateCreated = DateTime.UtcNow
            };
            var inactiveUser = new AppUser
            {
                Id = Guid.NewGuid(),
                FullName = "Inactive User",
                Email = "inactive@example.com",
                IsActive = false,
                DateCreated = DateTime.UtcNow
            };

            var allUsers = new List<AppUser> { activeUser, inactiveUser };
            _userRepoMock.Setup(r => r.GetUsersInRoleAsync("Customer")).ReturnsAsync(allUsers);

            var result = await _service.GetDebugInfoAsync();

            var resultType = result.GetType();
            var totalCustomers = (int)resultType.GetProperty("TotalCustomers")!.GetValue(result)!;
            var customers = (IEnumerable<object>)resultType.GetProperty("Customers")!.GetValue(result)!;

            Assert.Equal(1, totalCustomers);
            var customerList = customers.ToList();
            Assert.Single(customerList);

            var firstCustomer = customerList[0];
            var firstCustomerType = firstCustomer.GetType();
            var fullName = (string)firstCustomerType.GetProperty("FullName")!.GetValue(firstCustomer)!;

            Assert.Equal("Active User", fullName);
        }


        [Fact]
        public async Task GetDebugInfoAsync_ShouldReturnError_WhenExceptionThrown()
        {
            var exceptionMessage = "Test exception";
            _roleManagerMock.Setup(r => r.FindByNameAsync("Customer"))
                            .ThrowsAsync(new Exception(exceptionMessage));

            var result = await _service.GetDebugInfoAsync();

            var resultType = result.GetType();
            var error = (string)resultType.GetProperty("Error")!.GetValue(result)!;
            var totalCustomers = (int)resultType.GetProperty("TotalCustomers")!.GetValue(result)!;
            var customers = (IEnumerable<object>)resultType.GetProperty("Customers")!.GetValue(result)!;

            Assert.Equal(exceptionMessage, error);
            Assert.Equal(0, totalCustomers);
            Assert.Empty(customers);
        }

        [Fact]
        public async Task GetCustomerByIdAsync_ShouldReturnUser_WhenUserExists()
        {
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Nguyen Van C",
                Email = "c@example.com",
                PhoneNumber = "0912345678",
                IsActive = true,
                DateCreated = DateTime.UtcNow.AddDays(-10),
                DateModified = DateTime.UtcNow.AddDays(-5),
                Homes = new List<Home>
        {
            new Home { Id = Guid.NewGuid(), IsDeleted = false },
            new Home { Id = Guid.NewGuid(), IsDeleted = true }
        }
            };

            var mockUsers = new List<AppUser> { user }.BuildMock();
            _userRepoMock.Setup(r => r.GetUsersAsQueryable()).Returns(mockUsers);

            var objectTypes = new List<ObjectType> { new ObjectType { Id = Guid.NewGuid(), Name = "User" } }.BuildMock();
            _objTypeRepoMock.Setup(r => r.GetAll()).Returns(objectTypes);

            var fileRelations = new List<FileRelation>().BuildMock(); 
            _fileRelRepoMock.Setup(r => r.GetAll()).Returns(fileRelations);

            var result = await _service.GetCustomerByIdAsync(userId);

            Assert.NotNull(result);
            Assert.Equal(userId, result.Id);
            Assert.Equal("Nguyen Van C", result.FullName);
            Assert.Equal("c@example.com", result.Email);
            Assert.Equal("0912345678", result.PhoneNumber);
            Assert.True(result.IsActive);
            Assert.Equal(1, result.TotalHomes); 
        }

        [Fact]
        public async Task GetCustomerByIdAsync_ShouldThrow_WhenUserNotFound()
        {
            var userId = Guid.NewGuid();
            var mockUsers = new List<AppUser>().BuildMock();
            _userRepoMock.Setup(r => r.GetUsersAsQueryable()).Returns(mockUsers);

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.GetCustomerByIdAsync(userId));
        }

        [Fact]
        public async Task GetCustomerByIdAsync_ShouldThrow_WhenUserInactive()
        {
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Inactive User",
                IsActive = false,
                Homes = new List<Home>()
            };

            var mockUsers = new List<AppUser> { user }.BuildMock();
            _userRepoMock.Setup(r => r.GetUsersAsQueryable()).Returns(mockUsers);

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.GetCustomerByIdAsync(userId));
        }

        [Fact]
        public async Task GetUserAvatarUrlAsync_ShouldReturnLatestAvatar_WhenExists()
        {
            var userId = Guid.NewGuid();
            var objectTypeId = Guid.NewGuid();

            var objectTypes = new List<ObjectType>
    {
        new ObjectType { Id = objectTypeId, Name = RoleNames.Customer }
    };
            var objectTypesMock = objectTypes.BuildMock();
            _objTypeRepoMock.Setup(r => r.GetAll()).Returns(objectTypesMock);

            var file1 = new Core.Entities.File { Id = Guid.NewGuid(), FilePath = "old.jpg"};
            var file2 = new Core.Entities.File { Id = Guid.NewGuid(), FilePath = "latest.jpg" };
            var file3 = new Core.Entities.File { Id = Guid.NewGuid(), FilePath = "deleted.jpg" };

            var relations = new List<FileRelation>
    {
        new FileRelation { ObjectId = userId, ObjectTypeId = objectTypeId, RelationType = "avatar", File = file1, DateCreated = DateTime.UtcNow.AddDays(-2) },
        new FileRelation { ObjectId = userId, ObjectTypeId = objectTypeId, RelationType = "avatar", File = file2, DateCreated = DateTime.UtcNow },
        new FileRelation { ObjectId = userId, ObjectTypeId = objectTypeId, RelationType = "avatar", File = file3, DateCreated = DateTime.UtcNow.AddDays(-1) }
    };
            var relationsMock = relations.BuildMock();
            _fileRelRepoMock.Setup(r => r.GetAll()).Returns(relationsMock);

            var method = typeof(CustomerProfileService)
                .GetMethod("GetUserAvatarUrlAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            var result = await (Task<string?>)method!.Invoke(_service, new object[] { userId })!;

            Assert.NotNull(result);
            Assert.Equal("latest.jpg", result);
        }

        [Fact]
        public async Task GetUserAvatarUrlAsync_ShouldReturnNull_WhenNoAvatarFound()
        {
            var userId = Guid.NewGuid();

            var objectTypesMock = new List<ObjectType>().BuildMock();
            _objTypeRepoMock.Setup(r => r.GetAll()).Returns(objectTypesMock);

            var relationsMock = new List<FileRelation>().BuildMock();
            _fileRelRepoMock.Setup(r => r.GetAll()).Returns(relationsMock);

            var method = typeof(CustomerProfileService)
                .GetMethod("GetUserAvatarUrlAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

            var result = await (Task<string?>)method!.Invoke(_service, new object[] { userId })!;

            Assert.Null(result);
        }

    }
}

