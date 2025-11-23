using HSP.Core.Dtos.BookingDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Implementations.Internal;
using Microsoft.Extensions.Localization;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Xunit;

namespace HSP.Service.Test.Implementations.Internal
{
    public class BookingServiceTests
    {
        private readonly Mock<IRepository<Booking, Guid>> _mockBookingRepo;
        private readonly Mock<IRepository<BookingItem, Guid>> _mockBookingItemRepo;
        private readonly Mock<IRepository<TechnicianProfile, Guid>> _mockTechnicianRepo;
        private readonly Mock<IRepository<Core.Entities.Service, Guid>> _mockServiceRepo;
        private readonly Mock<IRepository<ChatConversation, Guid>> _mockConversationRepo;
        private readonly Mock<IUserRepository> _mockUserRepo;
        private readonly Mock<IRedisCacheService> _mockRedisService;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;

        public BookingServiceTests()
        {
            _mockBookingRepo = new Mock<IRepository<Booking, Guid>>();
            _mockBookingItemRepo = new Mock<IRepository<BookingItem, Guid>>();
            _mockTechnicianRepo = new Mock<IRepository<TechnicianProfile, Guid>>();
            _mockServiceRepo = new Mock<IRepository<Core.Entities.Service, Guid>>();
            _mockConversationRepo = new Mock<IRepository<ChatConversation, Guid>>();
            _mockUserRepo = new Mock<IUserRepository>();
            _mockRedisService = new Mock<IRedisCacheService>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();
        }

        private BookingService CreateService()
        {
            return new BookingService(
                _mockBookingRepo.Object,
                _mockBookingItemRepo.Object,
                _mockTechnicianRepo.Object,
                _mockServiceRepo.Object,
                _mockUserRepo.Object,
                _mockRedisService.Object,
                _mockConversationRepo.Object,
                _mockUnitOfWork.Object,
                _mockLocalizer.Object
            );
        }

        // ================== GET BOOKING DETAIL ==================
        [Fact]
        public async Task GetBookingDetailAsync_ShouldReturnDetail_WhenExists()
        {
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = customerId,
                TechnicianId = technicianId,
                ProblemDescription = "Issue",
                DesiredDate = DateTime.UtcNow,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                Status = BookingStatus.Pending,
                Customer = new AppUser
                {
                    Id = customerId,
                    UserName = "Customer",
                    Email = "c@example.com",
                    PhoneNumber = "111",
                    FullName = "Customer Name",
                    IsActive = true
                },
                Payments = new List<Payment>()
            };

            var technicians = new List<TechnicianProfile>
            {
                new TechnicianProfile
                {
                    Id = technicianId,
                    UserId = Guid.NewGuid(),
                    CitizenId = "123456789012",
                    Latitude = 10.0,
                    Longitude = 106.0,
                    ExperienceYears = 5,
                    ApprovalStatus = TechnicianApprovalStatus.Approved,
                    DateCreated = DateTime.UtcNow,
                    DateModified = DateTime.UtcNow,
                    User = new AppUser
                    {
                        Id = Guid.NewGuid(),
                        UserName = "Tech One",
                        Email = "tech@example.com",
                        PhoneNumber = "0987654321",
                        FullName = "Tech Full Name",
                        IsActive = true
                    }
                }
            };

            var technicianMock = technicians.BuildMock();

            _mockTechnicianRepo
                .Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(technicianMock);

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            var service = CreateService();
            var result = await service.GetBookingDetailAsync(bookingId);

            Assert.NotNull(result);
            Assert.Equal(bookingId, result.Id);
            Assert.Equal("c@example.com", result.CustomerEmail);
            Assert.Equal("tech@example.com", result.TechnicianEmail);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldReturnNull_WhenNotExists()
        {
            var bookingId = Guid.NewGuid();

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking>().BuildMock());

            var service = CreateService();
            var result = await service.GetBookingDetailAsync(bookingId);

            Assert.Null(result);
        }

        // ================== UPDATE BOOKING STATUS ==================
        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldReturnTrue_WhenValid()
        {
            var technicianId = Guid.NewGuid();
            var technicianUserId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                TechnicianId = technicianId,
                Status = BookingStatus.Pending,
                CustomerId = Guid.NewGuid(),
                DesiredDate = DateTime.UtcNow,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow
            };

            var technicianProfile = new TechnicianProfile
            {
                Id = technicianId,
                UserId = technicianUserId,
                CitizenId = "123456789012",
                Latitude = 10.0,
                Longitude = 106.0,
                ExperienceYears = 5,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                User = new AppUser
                {
                    Id = technicianUserId,
                    UserName = "Tech1",
                    FullName = "Technician One",
                    Email = "tech1@example.com",
                    IsActive = true
                }
            };

            _mockBookingRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(booking);

            var techs = new List<TechnicianProfile> { technicianProfile }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var service = CreateService();
            var input = new UpdateBookingStatusDto
            {
                BookingId = booking.Id,
                Status = BookingStatus.Completed
            };

            var result = await service.UpdateBookingStatusAsync(input, technicianUserId.ToString());

            Assert.True(result);
            Assert.Equal(BookingStatus.Completed, booking.Status);
            Assert.NotNull(booking.DateModified);
            Assert.NotNull(booking.DateCompleted);
            _mockBookingRepo.Verify(r => r.Update(booking), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldReturnFalse_WhenBookingNotFound()
        {
            _mockBookingRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Booking)null);

            var service = CreateService();
            var input = new UpdateBookingStatusDto
            {
                BookingId = Guid.NewGuid(),
                Status = BookingStatus.Completed
            };

            var result = await service.UpdateBookingStatusAsync(input, Guid.NewGuid().ToString());

            Assert.False(result);
            _mockBookingRepo.Verify(r => r.Update(It.IsAny<Booking>()), Times.Never);
        }

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldReturnFalse_WhenUnauthorizedTechnician()
        {
            var bookingTechnicianId = Guid.NewGuid();
            var differentTechnicianId = Guid.NewGuid();
            var differentUserId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                TechnicianId = bookingTechnicianId,
                Status = BookingStatus.Pending,
                CustomerId = Guid.NewGuid(),
                DesiredDate = DateTime.UtcNow
            };

            var technicianProfile = new TechnicianProfile
            {
                Id = differentTechnicianId,
                UserId = differentUserId,
                CitizenId = "123456789012",
                User = new AppUser { Id = differentUserId }
            };

            _mockBookingRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(booking);

            var techs = new List<TechnicianProfile> { technicianProfile }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            var service = CreateService();
            var input = new UpdateBookingStatusDto
            {
                BookingId = booking.Id,
                Status = BookingStatus.Completed
            };

            var result = await service.UpdateBookingStatusAsync(input, differentUserId.ToString());

            Assert.False(result);
            _mockBookingRepo.Verify(r => r.Update(It.IsAny<Booking>()), Times.Never);
        }

        // ================== CANCEL BOOKING ==================
        [Fact]
        public async Task CancelBookingAsync_ShouldReturnTrue_WhenValid()
        {
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                TechnicianId = technicianId,
                Status = BookingStatus.Confirmed,
                CustomerId = Guid.NewGuid(),
                DesiredDate = DateTime.UtcNow,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow
            };

            var technicianProfile = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                CitizenId = "123456789012",
                Latitude = 10.0,
                Longitude = 106.0,
                ExperienceYears = 5,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                User = new AppUser
                {
                    Id = userId,
                    UserName = "Tech1",
                    FullName = "Technician One",
                    Email = "tech1@example.com",
                    IsActive = true
                }
            };

            _mockBookingRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(booking);

            var techs = new List<TechnicianProfile> { technicianProfile }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var service = CreateService();
            var input = new CancelBookingDto
            {
                BookingId = booking.Id,
                Reason = "Test cancel"
            };

            var result = await service.CancelBookingAsync(input, userId.ToString());

            Assert.True(result);
            Assert.Equal(BookingStatus.Cancelled, booking.Status);
            Assert.NotNull(booking.Cancellation);
            Assert.Equal("Test cancel", booking.Cancellation.Reason);
            Assert.Equal(technicianId, booking.Cancellation.CancelledBy);
            _mockBookingRepo.Verify(r => r.Update(booking), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldReturnFalse_WhenBookingNotFound()
        {
            _mockBookingRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Booking)null);

            var service = CreateService();
            var input = new CancelBookingDto
            {
                BookingId = Guid.NewGuid(),
                Reason = "Test"
            };

            var result = await service.CancelBookingAsync(input, Guid.NewGuid().ToString());

            Assert.False(result);
            _mockBookingRepo.Verify(r => r.Update(It.IsAny<Booking>()), Times.Never);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldReturnFalse_WhenBookingAlreadyCompleted()
        {
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                TechnicianId = technicianId,
                Status = BookingStatus.Completed,
                DateCompleted = DateTime.UtcNow,
                CustomerId = Guid.NewGuid(),
                DesiredDate = DateTime.UtcNow
            };

            var technicianProfile = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                CitizenId = "123456789012",
                User = new AppUser { Id = userId }
            };

            _mockBookingRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(booking);

            var techs = new List<TechnicianProfile> { technicianProfile }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            var service = CreateService();
            var input = new CancelBookingDto
            {
                BookingId = booking.Id,
                Reason = "Test"
            };

            var result = await service.CancelBookingAsync(input, userId.ToString());

            Assert.False(result);
            _mockBookingRepo.Verify(r => r.Update(It.IsAny<Booking>()), Times.Never);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldReturnFalse_WhenBookingAlreadyCancelled()
        {
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                TechnicianId = technicianId,
                Status = BookingStatus.Cancelled,
                CustomerId = Guid.NewGuid(),
                DesiredDate = DateTime.UtcNow
            };

            var technicianProfile = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                CitizenId = "123456789012",
                User = new AppUser { Id = userId }
            };

            _mockBookingRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(booking);

            var techs = new List<TechnicianProfile> { technicianProfile }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            var service = CreateService();
            var input = new CancelBookingDto
            {
                BookingId = booking.Id,
                Reason = "Test"
            };

            var result = await service.CancelBookingAsync(input, userId.ToString());

            Assert.False(result);
            _mockBookingRepo.Verify(r => r.Update(It.IsAny<Booking>()), Times.Never);
        }

        // ================== ACCEPT BOOKING EMAIL ==================
        [Fact]
        public async Task AcceptBookingEmailAsync_ShouldReturnSuccess_WhenValid()
        {
            var customerId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();
            var technicianUserId = Guid.NewGuid();
            var serviceId = Guid.NewGuid();
            var token = "token123";
            var desiredDate = DateTime.UtcNow.AddDays(1);

            _mockRedisService.Setup(r => r.GetAsync<string>($"waiting_{token}")).ReturnsAsync("exists");
            _mockRedisService.Setup(r => r.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(technicianId);

            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = technicianUserId,
                CitizenId = "123456789012",
                Latitude = 10.0,
                Longitude = 106.0,
                ExperienceYears = 5,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                User = new AppUser
                {
                    Id = technicianUserId,
                    Email = "t@example.com",
                    UserName = "Technician",
                    FullName = "Tech Full Name",
                    IsActive = true
                }
            };
            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll()).Returns(technicians);

            var customer = new AppUser
            {
                Id = customerId,
                Email = "c@example.com",
                UserName = "Customer",
                FullName = "Customer Name",
                IsActive = true
            };
            _mockUserRepo.Setup(r => r.FindByIdAsync(customerId)).ReturnsAsync(customer);

            var service = new Core.Entities.Service
            {
                Id = serviceId,
                Name = "Test Service",
                Price = 100,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                IsDeleted = false
            };
            var services = new List<Core.Entities.Service> { service }.BuildMock();
            _mockServiceRepo.Setup(r => r.GetAll()).Returns(services);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var bookingService = CreateService();
            var result = await bookingService.AcceptBookingEmailAsync(
                customerId, technicianId, new List<Guid> { serviceId }, token, desiredDate);

            Assert.True(result.IsSuccess);
            Assert.Equal("Xác nhận thành công!", result.Message);
            _mockBookingRepo.Verify(r => r.AddAsync(It.IsAny<Booking>()), Times.Once);
            _mockBookingItemRepo.Verify(r => r.AddRangeAsync(It.IsAny<List<BookingItem>>()), Times.Once);
            _mockConversationRepo.Verify(r => r.AddAsync(It.IsAny<ChatConversation>()), Times.Once);
            _mockRedisService.Verify(r => r.RemoveAsync($"waiting_{token}"), Times.Once);
            _mockRedisService.Verify(r => r.SetAsync($"accepted_{token}", technician.Id, TimeSpan.FromSeconds(60)), Times.Once);
        }

        [Fact]
        public async Task AcceptBookingEmailAsync_ShouldReturnFailure_WhenTokenExpired()
        {
            var token = "expired-token";

            _mockRedisService.Setup(r => r.GetAsync<string>($"waiting_{token}")).ReturnsAsync((string)null);

            var service = CreateService();
            var result = await service.AcceptBookingEmailAsync(
                Guid.NewGuid(), Guid.NewGuid(), new List<Guid>(), token, DateTime.UtcNow);

            Assert.False(result.IsSuccess);
            Assert.Equal("Link đã hết hạn hoặc đã được sử dụng.", result.Message);
            _mockBookingRepo.Verify(r => r.AddAsync(It.IsAny<Booking>()), Times.Never);
        }

        [Fact]
        public async Task AcceptBookingEmailAsync_ShouldReturnFailure_WhenTechnicianNotFound()
        {
            var token = "valid-token";
            var technicianId = Guid.NewGuid();

            _mockRedisService.Setup(r => r.GetAsync<string>($"waiting_{token}")).ReturnsAsync("exists");

            var technicians = new List<TechnicianProfile>().BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll()).Returns(technicians);

            var service = CreateService();
            var result = await service.AcceptBookingEmailAsync(
                Guid.NewGuid(), technicianId, new List<Guid>(), token, DateTime.UtcNow);

            Assert.False(result.IsSuccess);
            Assert.Equal("Không tìm thấy kỹ thuật viên.", result.Message);
        }

        [Fact]
        public async Task AcceptBookingEmailAsync_ShouldReturnFailure_WhenTechnicianIdMismatch()
        {
            var token = "valid-token";
            var technicianId = Guid.NewGuid();
            var differentTechnicianId = Guid.NewGuid();
            var technicianUserId = Guid.NewGuid();

            _mockRedisService.Setup(r => r.GetAsync<string>($"waiting_{token}")).ReturnsAsync("exists");
            _mockRedisService.Setup(r => r.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(differentTechnicianId);

            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = technicianUserId,
                CitizenId = "123456789012",
                User = new AppUser { Id = technicianUserId }
            };
            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll()).Returns(technicians);

            var service = CreateService();
            var result = await service.AcceptBookingEmailAsync(
                Guid.NewGuid(), technicianId, new List<Guid>(), token, DateTime.UtcNow);

            Assert.False(result.IsSuccess);
            Assert.Equal("Token không hợp lệ hoặc kỹ thuật viên không khớp.", result.Message);
        }

        [Fact]
        public async Task AcceptBookingEmailAsync_ShouldReturnFailure_WhenCustomerNotFound()
        {
            var customerId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();
            var technicianUserId = Guid.NewGuid();
            var token = "valid-token";

            _mockRedisService.Setup(r => r.GetAsync<string>($"waiting_{token}")).ReturnsAsync("exists");
            _mockRedisService.Setup(r => r.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(technicianId);

            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = technicianUserId,
                CitizenId = "123456789012",
                User = new AppUser { Id = technicianUserId }
            };
            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll()).Returns(technicians);

            _mockUserRepo.Setup(r => r.FindByIdAsync(customerId)).ReturnsAsync((AppUser)null);

            var service = CreateService();
            var result = await service.AcceptBookingEmailAsync(
                customerId, technicianId, new List<Guid>(), token, DateTime.UtcNow);

            Assert.False(result.IsSuccess);
            Assert.Equal("Dữ liệu khách hàng không hợp lệ.", result.Message);
        }

        [Fact]
        public async Task AcceptBookingEmailAsync_ShouldReturnFailure_WhenServicesNotFound()
        {
            var customerId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();
            var technicianUserId = Guid.NewGuid();
            var serviceId = Guid.NewGuid();
            var token = "valid-token";

            _mockRedisService.Setup(r => r.GetAsync<string>($"waiting_{token}")).ReturnsAsync("exists");
            _mockRedisService.Setup(r => r.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(technicianId);

            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = technicianUserId,
                CitizenId = "123456789012",
                User = new AppUser { Id = technicianUserId }
            };
            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll()).Returns(technicians);

            var customer = new AppUser { Id = customerId };
            _mockUserRepo.Setup(r => r.FindByIdAsync(customerId)).ReturnsAsync(customer);

            var services = new List<Core.Entities.Service>().BuildMock();
            _mockServiceRepo.Setup(r => r.GetAll()).Returns(services);

            var service = CreateService();
            var result = await service.AcceptBookingEmailAsync(
                customerId, technicianId, new List<Guid> { serviceId }, token, DateTime.UtcNow);

            Assert.False(result.IsSuccess);
            Assert.Equal("Không tìm thấy dịch vụ hợp lệ.", result.Message);
        }
    }
}