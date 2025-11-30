using HSP.Core.Dtos.BookingDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Implementations.Internal;
using Microsoft.EntityFrameworkCore.Storage;
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
        private readonly Mock<IEmailService> _mockEmailService; // ADDED


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
            _mockEmailService = new Mock<IEmailService>(); // ✅ KHỞI TẠO MOCK

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
                _mockLocalizer.Object,
                _mockEmailService.Object // ✅ THÊM VÀO CONSTRUCTOR
            );
        }

        // ================== GET ALL BOOKINGS ==================

        [Fact]
        public async Task GetAllBookingsAsync_ShouldReturnAllBookings_WhenNoFiltersApplied()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            TechnicianId = technicianId,
            ProblemDescription = "Test Issue 1",
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser
            {
                Id = customerId,
                UserName = "Customer1",
                Email = "c1@example.com",
                PhoneNumber = "111",
                FullName = "Customer One",
                IsActive = true
            }
        },
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            TechnicianId = null,
            ProblemDescription = "Test Issue 2",
            DesiredDate = DateTime.UtcNow.AddDays(1),
            Status = BookingStatus.Confirmed,
            DateCreated = DateTime.UtcNow.AddHours(-1),
            DateModified = DateTime.UtcNow,
            Customer = new AppUser
            {
                Id = customerId,
                UserName = "Customer2",
                Email = "c2@example.com",
                PhoneNumber = "222",
                FullName = "Customer Two",
                IsActive = true
            }
        }
    };

            var bookingsMock = bookings.BuildMock();
            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsMock);

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput
            {
                PageNumber = 1,
                PageSize = 10
            };

            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldFilterBySearchTerm_WhenSearchTermProvided()
        {
            // Arrange
            var customerId = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            ProblemDescription = "Broken pipe issue",
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser
            {
                Id = customerId,
                UserName = "JohnDoe",
                Email = "john@example.com",
                PhoneNumber = "111",
                FullName = "John Doe",
                IsActive = true
            }
        },
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            ProblemDescription = "Electrical problem",
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = "JaneSmith",
                Email = "jane@example.com",
                PhoneNumber = "222",
                FullName = "Jane Smith",
                IsActive = true
            }
        }
    };

            var bookingsMock = bookings.BuildMock();
            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsMock);

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput
            {
                SearchTerm = "John",
                PageNumber = 1,
                PageSize = 10
            };

            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal("john@example.com", result.Items.First().Customer.Email);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldFilterByProblemDescription_WhenSearchTermMatches()
        {
            // Arrange
            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            ProblemDescription = "Water leakage in bathroom",
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = "User1",
                Email = "u1@example.com",
                PhoneNumber = "111",
                IsActive = true
            }
        },
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            ProblemDescription = "Electrical issue",
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = "User2",
                Email = "u2@example.com",
                PhoneNumber = "222",
                IsActive = true
            }
        }
    };

            var bookingsMock = bookings.BuildMock();
            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsMock);

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput
            {
                SearchTerm = "leakage",
                PageNumber = 1,
                PageSize = 10
            };

            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Contains("leakage", result.Items.First().ProblemDescription);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldFilterByStatus_WhenStatusProvided()
        {
            // Arrange
            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            ProblemDescription = "Issue 1",
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "User1", IsActive = true }
        },
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            ProblemDescription = "Issue 2",
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "User2", IsActive = true }
        },
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            ProblemDescription = "Issue 3",
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "User3", IsActive = true }
        }
    };

            var bookingsMock = bookings.BuildMock();
            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsMock);

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput
            {
                Status = BookingStatus.Completed,
                PageNumber = 1,
                PageSize = 10
            };

            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.All(result.Items, item => Assert.Equal(BookingStatus.Completed, item.Status));
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldFilterByTechnicianId_WhenTechnicianIdProvided()
        {
            // Arrange
            var technicianId = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            TechnicianId = technicianId,
            ProblemDescription = "Issue 1",
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Confirmed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "User1", IsActive = true }
        },
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            TechnicianId = Guid.NewGuid(),
            ProblemDescription = "Issue 2",
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Confirmed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "User2", IsActive = true }
        }
    };

            var bookingsMock = bookings.BuildMock();
            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsMock);

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput
            {
                TechnicianId = technicianId,
                PageNumber = 1,
                PageSize = 10
            };

            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal(technicianId, result.Items.First().TechnicianId);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldFilterByCustomerId_WhenCustomerIdProvided()
        {
            // Arrange
            var customerId = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            ProblemDescription = "Issue 1",
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = customerId, UserName = "Customer", IsActive = true }
        },
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            ProblemDescription = "Issue 2",
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "OtherCustomer", IsActive = true }
        }
    };

            var bookingsMock = bookings.BuildMock();
            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsMock);

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput
            {
                CustomerId = customerId,
                PageNumber = 1,
                PageSize = 10
            };

            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal(customerId, result.Items.First().CustomerProfileId);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldFilterByDateRange_WhenFromDateAndToDateProvided()
        {
            // Arrange
            var fromDate = DateTime.UtcNow.Date;
            var toDate = DateTime.UtcNow.Date.AddDays(5);

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            DesiredDate = DateTime.UtcNow.Date.AddDays(2), // Within range
            ProblemDescription = "Issue 1",
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "User1", IsActive = true }
        },
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            DesiredDate = DateTime.UtcNow.Date.AddDays(-1), // Before range
            ProblemDescription = "Issue 2",
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "User2", IsActive = true }
        },
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            DesiredDate = DateTime.UtcNow.Date.AddDays(10), // After range
            ProblemDescription = "Issue 3",
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "User3", IsActive = true }
        }
    };

            var bookingsMock = bookings.BuildMock();
            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsMock);

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput
            {
                FromDate = fromDate,
                ToDate = toDate,
                PageNumber = 1,
                PageSize = 10
            };

            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldCalculateTotalPrice_FromBookingItems()
        {
            // Arrange
            var bookingId = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = bookingId,
            CustomerId = Guid.NewGuid(),
            DesiredDate = DateTime.UtcNow,
            ProblemDescription = "Issue",
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "User1", IsActive = true }
        }
    };

            var bookingItems = new List<BookingItem>
    {
        new BookingItem
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            ServiceId = Guid.NewGuid(),
            Price = 100,
            IsDeleted = false
        },
        new BookingItem
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            ServiceId = Guid.NewGuid(),
            Price = 200,
            IsDeleted = false
        },
        new BookingItem
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            ServiceId = Guid.NewGuid(),
            Price = 50,
            IsDeleted = true // Should be excluded
        }
    };

            var bookingsMock = bookings.BuildMock();
            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsMock);

            var bookingItemsMock = bookingItems.BuildMock();
            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(bookingItemsMock);

            var input = new BookingInput
            {
                PageNumber = 1,
                PageSize = 10
            };

            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Items);
            Assert.Equal(300, result.Items.First().TotalPrice); // 100 + 200, excluding deleted item
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldOrderByDateCreatedDescending_WhenNoOrderBySpecified()
        {
            // Arrange
            var oldDate = DateTime.UtcNow.AddDays(-2);
            var recentDate = DateTime.UtcNow;

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            DesiredDate = DateTime.UtcNow,
            ProblemDescription = "Old Issue",
            Status = BookingStatus.Pending,
            DateCreated = oldDate,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "User1", IsActive = true }
        },
        new Booking
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            DesiredDate = DateTime.UtcNow,
            ProblemDescription = "Recent Issue",
            Status = BookingStatus.Pending,
            DateCreated = recentDate,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "User2", IsActive = true }
        }
    };

            var bookingsMock = bookings.BuildMock();
            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsMock);

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput
            {
                PageNumber = 1,
                PageSize = 10
            };

            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal("Recent Issue", result.Items.First().ProblemDescription);
            Assert.Equal("Old Issue", result.Items.Last().ProblemDescription);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldReturnEmptyList_WhenNoBookingsMatch()
        {
            // Arrange
            var bookingsMock = new List<Booking>().BuildMock();
            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsMock);

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput
            {
                SearchTerm = "NonExistentTerm",
                PageNumber = 1,
                PageSize = 10
            };

            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0, result.TotalCount);
            Assert.Empty(result.Items);
        }

        //    [Fact]
        //    public async Task GetAllBookingsAsync_ShouldIncludeFeedbackAndCancellation_WhenAvailable()
        //    {
        //        // Arrange
        //        var bookingId = Guid.NewGuid();

        //        var bookings = new List<Booking>
        //{
        //    new Booking
        //    {
        //        Id = bookingId,
        //        CustomerId = Guid.NewGuid(),
        //        DesiredDate = DateTime.UtcNow,
        //        ProblemDescription = "Issue",
        //        Status = BookingStatus.Cancelled,
        //        DateCreated = DateTime.UtcNow,
        //        DateModified = DateTime.UtcNow,
        //        Customer = new AppUser { Id = Guid.NewGuid(), UserName = "User1", IsActive = true },
        //        Feedback = new BookingFeedback
        //        {
        //            BookingId = bookingId,
        //            Rating = 5,
        //            Comment = "Great service"
        //        },
        //        Cancellation = new BookingCancellation
        //        {
        //            BookingId = bookingId,
        //            Reason = "Customer request",
        //            CancelledBy = Guid.NewGuid(),
        //            CancelledAt = DateTime.UtcNow
        //        }
        //    }
        //};

        //        var bookingsMock = bookings.BuildMock();
        //        _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
        //            .Returns(bookingsMock);

        //        _mockBookingItemRepo.Setup(r => r.GetAll())
        //            .Returns(new List<BookingItem>().BuildMock());

        //        var input = new BookingInput
        //        {
        //            PageNumber = 1,
        //            PageSize = 10
        //        };

        //        var service = CreateService();

        //        // Act
        //        var result = await service.GetAllBookingsAsync(input);

        //        // Assert
        //        Assert.NotNull(result);
        //        Assert.Single(result.Items);
        //        var booking = result.Items.First();
        //        Assert.NotNull(booking.Feedback);
        //        Assert.Equal(5, booking.Feedback.Rating);
        //        Assert.Equal("Great service", booking.Feedback.Comment);
        //        Assert.NotNull(booking.Cancellation);
        //        Assert.Equal("Customer request", booking.Cancellation.Reason);
        //    }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldApplyPagination_Correctly()
        {
            // Arrange
            var bookings = Enumerable.Range(1, 15).Select(i => new Booking
            {
                Id = Guid.NewGuid(),
                CustomerId = Guid.NewGuid(),
                DesiredDate = DateTime.UtcNow,
                ProblemDescription = $"Issue {i}",
                Status = BookingStatus.Pending,
                DateCreated = DateTime.UtcNow.AddMinutes(-i),
                DateModified = DateTime.UtcNow,
                Customer = new AppUser
                {
                    Id = Guid.NewGuid(),
                    UserName = $"User{i}",
                    IsActive = true
                }
            }).ToList();

            var bookingsMock = bookings.BuildMock();
            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsMock);

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput
            {
                PageNumber = 2,
                PageSize = 5
            };

            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(15, result.TotalCount);
            Assert.Equal(5, result.PageSize);
            Assert.Equal(2, result.CurrentPage);
            Assert.Equal(3, result.TotalPages); // 15 items / 5 per page = 3 pages
            Assert.Equal(5, result.Items.Count);
            Assert.True(result.HasPrevious); // Page 2 has previous
            Assert.True(result.HasNext); // Page 2 has next (page 3)
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldReturnFirstPage_WithCorrectPaginationMetadata()
        {
            // Arrange
            var bookings = Enumerable.Range(1, 10).Select(i => new Booking
            {
                Id = Guid.NewGuid(),
                CustomerId = Guid.NewGuid(),
                DesiredDate = DateTime.UtcNow,
                ProblemDescription = $"Issue {i}",
                Status = BookingStatus.Pending,
                DateCreated = DateTime.UtcNow.AddMinutes(-i),
                DateModified = DateTime.UtcNow,
                Customer = new AppUser
                {
                    Id = Guid.NewGuid(),
                    UserName = $"User{i}",
                    IsActive = true
                }
            }).ToList();

            var bookingsMock = bookings.BuildMock();
            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsMock);

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput
            {
                PageNumber = 1,
                PageSize = 5
            };

            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(10, result.TotalCount);
            Assert.Equal(5, result.PageSize);
            Assert.Equal(1, result.CurrentPage);
            Assert.Equal(2, result.TotalPages);
            Assert.Equal(5, result.Items.Count);
            Assert.False(result.HasPrevious); // First page has no previous
            Assert.True(result.HasNext); // Has page 2
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldReturnLastPage_WithCorrectPaginationMetadata()
        {
            // Arrange
            var bookings = Enumerable.Range(1, 12).Select(i => new Booking
            {
                Id = Guid.NewGuid(),
                CustomerId = Guid.NewGuid(),
                DesiredDate = DateTime.UtcNow,
                ProblemDescription = $"Issue {i}",
                Status = BookingStatus.Pending,
                DateCreated = DateTime.UtcNow.AddMinutes(-i),
                DateModified = DateTime.UtcNow,
                Customer = new AppUser
                {
                    Id = Guid.NewGuid(),
                    UserName = $"User{i}",
                    IsActive = true
                }
            }).ToList();

            var bookingsMock = bookings.BuildMock();
            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsMock);

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput
            {
                PageNumber = 3,
                PageSize = 5
            };

            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(12, result.TotalCount);
            Assert.Equal(5, result.PageSize);
            Assert.Equal(3, result.CurrentPage);
            Assert.Equal(3, result.TotalPages);
            Assert.Equal(2, result.Items.Count); // Last page only has 2 items
            Assert.True(result.HasPrevious); // Has previous pages
            Assert.False(result.HasNext); // Last page has no next
        }

        // ================== GET ALL BOOKINGS - FEEDBACKS & CANCELLATION ==================

        [Fact]
        public async Task GetAllBookingsAsync_ShouldIncludeFeedbacks_InBookingList()
        {
            // Arrange
            var bookingId1 = Guid.NewGuid();
            var bookingId2 = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = bookingId1,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            ProblemDescription = "Issue 1",
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = customerId, UserName = "Customer1", IsActive = true },
            Feedbacks = new List<BookingFeedback>
            {
                new BookingFeedback
                {
                    BookingId = bookingId1,
                    Rating = 5,
                    Comment = "Great!",
                    Source = FeedbackSource.Customer
                },
                new BookingFeedback
                {
                    BookingId = bookingId1,
                    Rating = 4,
                    Comment = "Good customer",
                    Source = FeedbackSource.Technician
                }
            }
        },
        new Booking
        {
            Id = bookingId2,
            CustomerId = Guid.NewGuid(),
            DesiredDate = DateTime.UtcNow,
            ProblemDescription = "Issue 2",
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "Customer2", IsActive = true },
            Feedbacks = new List<BookingFeedback>()
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput { PageNumber = 1, PageSize = 10 };
            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);

            var booking1 = result.Items.First(b => b.Id == bookingId1);
            Assert.Equal(2, booking1.Feedbacks.Count);
            Assert.Contains(booking1.Feedbacks, f => f.Rating == 5 && f.Source == FeedbackSource.Customer);
            Assert.Contains(booking1.Feedbacks, f => f.Rating == 4 && f.Source == FeedbackSource.Technician);

            var booking2 = result.Items.First(b => b.Id == bookingId2);
            Assert.Empty(booking2.Feedbacks);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldIncludeCancellation_InBookingList()
        {
            // Arrange
            var bookingId1 = Guid.NewGuid();
            var bookingId2 = Guid.NewGuid();
            var cancelledBy = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = bookingId1,
            CustomerId = Guid.NewGuid(),
            DesiredDate = DateTime.UtcNow,
            ProblemDescription = "Cancelled Issue",
            Status = BookingStatus.Cancelled,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "Customer1", IsActive = true },
            Cancellation = new BookingCancellation
            {
                BookingId = bookingId1,
                Reason = "Weather conditions",
                CancelledBy = cancelledBy,
                CancelledAt = DateTime.UtcNow
            }
        },
        new Booking
        {
            Id = bookingId2,
            CustomerId = Guid.NewGuid(),
            DesiredDate = DateTime.UtcNow,
            ProblemDescription = "Active Issue",
            Status = BookingStatus.Confirmed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = Guid.NewGuid(), UserName = "Customer2", IsActive = true },
            Cancellation = null
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput { PageNumber = 1, PageSize = 10 };
            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);

            var cancelledBooking = result.Items.First(b => b.Id == bookingId1);
            Assert.NotNull(cancelledBooking.Cancellation);
            Assert.Equal("Weather conditions", cancelledBooking.Cancellation.Reason);
            Assert.Equal(cancelledBy, cancelledBooking.Cancellation.CancelledBy);

            var activeBooking = result.Items.First(b => b.Id == bookingId2);
            Assert.Null(activeBooking.Cancellation);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldMapAllFeedbackProperties_Correctly()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = bookingId,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            ProblemDescription = "Test",
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = customerId, UserName = "Customer", IsActive = true },
            Feedbacks = new List<BookingFeedback>
            {
                new BookingFeedback
                {
                    BookingId = bookingId,
                    Rating = 3,
                    Comment = "Test comment",
                    Source = FeedbackSource.Customer
                }
            }
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll())
                .Returns(new List<BookingItem>().BuildMock());

            var input = new BookingInput { PageNumber = 1, PageSize = 10 };
            var service = CreateService();

            // Act
            var result = await service.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            var booking = result.Items.First();
            var feedback = booking.Feedbacks.First();

            Assert.Equal(bookingId, feedback.BookingId);
            Assert.Equal(3, feedback.Rating);
            Assert.Equal("Test comment", feedback.Comment);
            Assert.Equal(FeedbackSource.Customer, feedback.Source);
        }

        // ================== UPDATE BOOKING STATUS - ADDITIONAL TESTS ==================

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldNotSetDateCompleted_WhenStatusIsNotCompleted()
        {
            // Arrange
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
                DateModified = DateTime.UtcNow,
                DateCompleted = null
            };

            var technicianProfile = new TechnicianProfile
            {
                Id = technicianId,
                UserId = technicianUserId,
                CitizenId = "123456789012",
                User = new AppUser { Id = technicianUserId }
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
                Status = BookingStatus.InProgress
            };

            // Act
            var result = await service.UpdateBookingStatusAsync(input, technicianUserId.ToString());

            // Assert
            Assert.True(result);
            Assert.Equal(BookingStatus.InProgress, booking.Status);
            Assert.Null(booking.DateCompleted); // Should remain null
            Assert.NotNull(booking.DateModified);
        }

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldUpdateFromPendingToConfirmed()
        {
            // Arrange
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
                User = new AppUser { Id = technicianUserId }
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
                Status = BookingStatus.Confirmed
            };

            // Act
            var result = await service.UpdateBookingStatusAsync(input, technicianUserId.ToString());

            // Assert
            Assert.True(result);
            Assert.Equal(BookingStatus.Confirmed, booking.Status);
        }

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldReturnFalse_WhenTechnicianProfileNotFound()
        {
            // Arrange
            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                TechnicianId = Guid.NewGuid(),
                Status = BookingStatus.Pending,
                CustomerId = Guid.NewGuid(),
                DesiredDate = DateTime.UtcNow
            };

            _mockBookingRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(booking);

            var techs = new List<TechnicianProfile>().BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            var service = CreateService();
            var input = new UpdateBookingStatusDto
            {
                BookingId = booking.Id,
                Status = BookingStatus.Completed
            };

            // Act
            var result = await service.UpdateBookingStatusAsync(input, Guid.NewGuid().ToString());

            // Assert
            Assert.False(result);
            _mockBookingRepo.Verify(r => r.Update(It.IsAny<Booking>()), Times.Never);
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

        [Fact]
        public async Task GetBookingDetailAsync_ShouldIncludeBookingItems_WithServiceDetails()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var serviceId1 = Guid.NewGuid();
            var serviceId2 = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = customerId,
                TechnicianId = null,
                ProblemDescription = "Test Issue",
                DesiredDate = DateTime.UtcNow,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                Status = BookingStatus.Pending,
                Customer = new AppUser
                {
                    Id = customerId,
                    UserName = "Customer",
                    Email = "customer@test.com",
                    PhoneNumber = "123",
                    IsActive = true
                },
                Payments = new List<Payment>()
            };

            var bookingItems = new List<BookingItem>
    {
        new BookingItem
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            ServiceId = serviceId1,
            Price = 150,
            IsDeleted = false,
            Service = new Core.Entities.Service
            {
                Id = serviceId1,
                Name = "Plumbing Repair",
                Price = 150,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow
            }
        },
        new BookingItem
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            ServiceId = serviceId2,
            Price = 200,
            IsDeleted = false,
            Service = new Core.Entities.Service
            {
                Id = serviceId2,
                Name = "Electrical Work",
                Price = 200,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow
            }
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(bookingItems.BuildMock());

            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            var service = CreateService();

            // Act
            var result = await service.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Items.Count);
            Assert.Equal(350, result.TotalPrice); // 150 + 200

            var item1 = result.Items.First();
            Assert.Equal(serviceId1, item1.ServiceId);
            Assert.Equal("Plumbing Repair", item1.ServiceName);
            Assert.Equal(150, item1.Price);

            var item2 = result.Items.Last();
            Assert.Equal(serviceId2, item2.ServiceId);
            Assert.Equal("Electrical Work", item2.ServiceName);
            Assert.Equal(200, item2.Price);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldExcludeDeletedItems_FromTotalPrice()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = customerId,
                DesiredDate = DateTime.UtcNow,
                Status = BookingStatus.Pending,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                Customer = new AppUser { Id = customerId, UserName = "Customer", IsActive = true },
                Payments = new List<Payment>()
            };

            var bookingItems = new List<BookingItem>
    {
        new BookingItem
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            ServiceId = Guid.NewGuid(),
            Price = 100,
            IsDeleted = false,
            Service = new Core.Entities.Service { Name = "Active Service" }
        },
        new BookingItem
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            ServiceId = Guid.NewGuid(),
            Price = 500,
            IsDeleted = true, // Should be excluded
            Service = new Core.Entities.Service { Name = "Deleted Service" }
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(bookingItems.BuildMock());

            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            var service = CreateService();

            // Act
            var result = await service.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Items);
            Assert.Equal(100, result.TotalPrice); // Only non-deleted item
            Assert.Equal("Active Service", result.Items.First().ServiceName);
        }

        // Test cho GetBookingDetailAsync - Payments mapping
        [Fact]
        public async Task GetBookingDetailAsync_ShouldOrderPayments_ByDateCreatedDescending()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var oldDate = DateTime.UtcNow.AddHours(-5);
            var middleDate = DateTime.UtcNow.AddHours(-2);
            var recentDate = DateTime.UtcNow;

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = customerId,
                DesiredDate = DateTime.UtcNow,
                Status = BookingStatus.Confirmed,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                Customer = new AppUser { Id = customerId, UserName = "Customer", IsActive = true },
                Payments = new List<Payment>
        {
            new Payment
            {
                Id = Guid.NewGuid(),
                BookingId = bookingId,
                Amount = 100,
                PaymentMethod = PaymentMethod.Cash,
                Status = PaymentStatus.Completed,
                TransactionId = "OLD",
                PaidAt = oldDate,
                DateCreated = oldDate
            },
            new Payment
            {
                Id = Guid.NewGuid(),
                BookingId = bookingId,
                Amount = 200,
                PaymentMethod = PaymentMethod.QRCode,
                Status = PaymentStatus.Completed,
                TransactionId = "RECENT",
                PaidAt = recentDate,
                DateCreated = recentDate
            },
            new Payment
            {
                Id = Guid.NewGuid(),
                BookingId = bookingId,
                Amount = 150,
                PaymentMethod = PaymentMethod.BankTransfer,
                Status = PaymentStatus.Pending,
                TransactionId = "MIDDLE",
                PaidAt = null,
                DateCreated = middleDate
            }
        }
            };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            var service = CreateService();

            // Act
            var result = await service.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(3, result.Payments.Count);

            var paymentsList = result.Payments.ToList();

            // Verify order: most recent first
            Assert.Equal("RECENT", paymentsList[0].TransactionId);
            Assert.Equal(200, paymentsList[0].Amount);
            Assert.Equal(PaymentMethod.QRCode, paymentsList[0].PaymentMethod);
            Assert.Equal(PaymentStatus.Completed, paymentsList[0].Status);
            Assert.Equal(recentDate, paymentsList[0].PaidAt);

            Assert.Equal("MIDDLE", paymentsList[1].TransactionId);
            Assert.Equal(150, paymentsList[1].Amount);
            Assert.Equal(PaymentMethod.BankTransfer, paymentsList[1].PaymentMethod);
            Assert.Null(paymentsList[1].PaidAt);

            Assert.Equal("OLD", paymentsList[2].TransactionId);
            Assert.Equal(100, paymentsList[2].Amount);
            Assert.Equal(PaymentMethod.Cash, paymentsList[2].PaymentMethod);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldMapAllPaymentProperties_Correctly()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var paymentId = Guid.NewGuid();
            var paidAt = DateTime.UtcNow;
            var createdAt = DateTime.UtcNow.AddMinutes(-5);

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = customerId,
                DesiredDate = DateTime.UtcNow,
                Status = BookingStatus.Confirmed,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                Customer = new AppUser { Id = customerId, UserName = "Customer", IsActive = true },
                Payments = new List<Payment>
        {
            new Payment
            {
                Id = paymentId,
                BookingId = bookingId,
                Amount = 250.50m,
                PaymentMethod = PaymentMethod.EWallet,
                Status = PaymentStatus.Completed,
                TransactionId = "TXN12345",
                PaidAt = paidAt,
                DateCreated = createdAt
            }
        }
            };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            var service = CreateService();

            // Act
            var result = await service.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Payments);

            var payment = result.Payments.First();
            Assert.Equal(paymentId, payment.Id);
            Assert.Equal(bookingId, payment.BookingId);
            Assert.Equal(250.50m, payment.Amount);
            Assert.Equal(PaymentMethod.EWallet, payment.PaymentMethod);
            Assert.Equal(PaymentStatus.Completed, payment.Status);
            Assert.Equal("TXN12345", payment.TransactionId);
            Assert.Equal(paidAt, payment.PaidAt);
            Assert.Equal(createdAt, payment.DateCreated);
        }

        // ================== GET BOOKING DETAIL - CUSTOMER RATING ==================

        [Fact]
        public async Task GetBookingDetailAsync_ShouldCalculateCustomerAverageRating_FromTechnicianFeedbacks()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var otherBookingId1 = Guid.NewGuid();
            var otherBookingId2 = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = bookingId,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser
            {
                Id = customerId,
                UserName = "Customer",
                FullName = "Customer Name",
                IsActive = true
            },
            Payments = new List<Payment>(),
            Feedbacks = new List<BookingFeedback>()
        },
        new Booking
        {
            Id = otherBookingId1,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Feedbacks = new List<BookingFeedback>
            {
                new BookingFeedback
                {
                    BookingId = otherBookingId1,
                    Rating = 5,
                    Comment = "Great customer",
                    Source = FeedbackSource.Technician
                }
            }
        },
        new Booking
        {
            Id = otherBookingId2,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Feedbacks = new List<BookingFeedback>
            {
                new BookingFeedback
                {
                    BookingId = otherBookingId2,
                    Rating = 3,
                    Comment = "Average",
                    Source = FeedbackSource.Technician
                }
            }
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            var service = CreateService();

            // Act
            var result = await service.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.CustomerAverageRating);
            Assert.Equal(4.0, result.CustomerAverageRating); // (5 + 3) / 2 = 4.0
            Assert.Equal(2, result.CustomerRatingCount);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldExcludeCustomerFeedbacks_FromAverageRating()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var otherBookingId = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = bookingId,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = customerId, UserName = "Customer", IsActive = true },
            Payments = new List<Payment>(),
            Feedbacks = new List<BookingFeedback>()
        },
        new Booking
        {
            Id = otherBookingId,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Feedbacks = new List<BookingFeedback>
            {
                new BookingFeedback
                {
                    BookingId = otherBookingId,
                    Rating = 5,
                    Source = FeedbackSource.Technician
                },
                new BookingFeedback
                {
                    BookingId = otherBookingId,
                    Rating = 1, // This should be excluded (Customer feedback)
                    Source = FeedbackSource.Customer
                }
            }
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            var service = CreateService();

            // Act
            var result = await service.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.CustomerAverageRating);
            Assert.Equal(5.0, result.CustomerAverageRating); // Only technician rating counted
            Assert.Equal(1, result.CustomerRatingCount);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldExcludeCurrentBooking_FromAverageRating()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = bookingId,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = customerId, UserName = "Customer", IsActive = true },
            Payments = new List<Payment>(),
            Feedbacks = new List<BookingFeedback>
            {
                new BookingFeedback
                {
                    BookingId = bookingId,
                    Rating = 5,
                    Source = FeedbackSource.Technician
                }
            }
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            var service = CreateService();

            // Act
            var result = await service.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.Null(result.CustomerAverageRating); // Current booking excluded
            Assert.Equal(0, result.CustomerRatingCount);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldReturnNull_ForCustomerAverageRating_WhenNoRatings()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = bookingId,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = customerId, UserName = "Customer", IsActive = true },
            Payments = new List<Payment>(),
            Feedbacks = new List<BookingFeedback>()
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            var service = CreateService();

            // Act
            var result = await service.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.Null(result.CustomerAverageRating);
            Assert.Equal(0, result.CustomerRatingCount);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldRoundAverageRating_ToOneDecimalPlace()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var otherBookingId1 = Guid.NewGuid();
            var otherBookingId2 = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = bookingId,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = customerId, UserName = "Customer", IsActive = true },
            Payments = new List<Payment>(),
            Feedbacks = new List<BookingFeedback>()
        },
        new Booking
        {
            Id = otherBookingId1,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Feedbacks = new List<BookingFeedback>
            {
                new BookingFeedback { Rating = 4, Source = FeedbackSource.Technician }
            }
        },
        new Booking
        {
            Id = otherBookingId2,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Feedbacks = new List<BookingFeedback>
            {
                new BookingFeedback { Rating = 5, Source = FeedbackSource.Technician }
            }
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            var service = CreateService();

            // Act
            var result = await service.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.CustomerAverageRating);
            Assert.Equal(4.5, result.CustomerAverageRating); // (4 + 5) / 2 = 4.5
        }

        // ================== GET BOOKING DETAIL - FEEDBACKS & CANCELLATION ==================

        [Fact]
        public async Task GetBookingDetailAsync_ShouldMapFeedbacks_Correctly()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = bookingId,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = customerId, UserName = "Customer", IsActive = true },
            Payments = new List<Payment>(),
            Feedbacks = new List<BookingFeedback>
            {
                new BookingFeedback
                {
                    BookingId = bookingId,
                    Rating = 5,
                    Comment = "Excellent service",
                    Source = FeedbackSource.Customer
                },
                new BookingFeedback
                {
                    BookingId = bookingId,
                    Rating = 4,
                    Comment = "Good customer",
                    Source = FeedbackSource.Technician
                }
            }
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            var service = CreateService();

            // Act
            var result = await service.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Feedbacks.Count);

            var customerFeedback = result.Feedbacks.First(f => f.Source == FeedbackSource.Customer);
            Assert.Equal(bookingId, customerFeedback.BookingId);
            Assert.Equal(5, customerFeedback.Rating);
            Assert.Equal("Excellent service", customerFeedback.Comment);

            var technicianFeedback = result.Feedbacks.First(f => f.Source == FeedbackSource.Technician);
            Assert.Equal(bookingId, technicianFeedback.BookingId);
            Assert.Equal(4, technicianFeedback.Rating);
            Assert.Equal("Good customer", technicianFeedback.Comment);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldReturnEmptyFeedbacks_WhenNoFeedbacks()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = bookingId,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Pending,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = customerId, UserName = "Customer", IsActive = true },
            Payments = new List<Payment>(),
            Feedbacks = new List<BookingFeedback>()
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            var service = CreateService();

            // Act
            var result = await service.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result.Feedbacks);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldMapCancellation_Correctly()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var cancelledBy = Guid.NewGuid();
            var cancelledAt = DateTime.UtcNow.AddHours(-2);

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = bookingId,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Cancelled,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = customerId, UserName = "Customer", IsActive = true },
            Payments = new List<Payment>(),
            Feedbacks = new List<BookingFeedback>(),
            Cancellation = new BookingCancellation
            {
                BookingId = bookingId,
                Reason = "Customer requested cancellation",
                CancelledBy = cancelledBy,
                CancelledAt = cancelledAt
            }
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            var service = CreateService();

            // Act
            var result = await service.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Cancellation);
            Assert.Equal(bookingId, result.Cancellation.BookingId);
            Assert.Equal("Customer requested cancellation", result.Cancellation.Reason);
            Assert.Equal(cancelledBy, result.Cancellation.CancelledBy);
            Assert.Equal(cancelledAt, result.Cancellation.CancelledAt);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldReturnNullCancellation_WhenNotCancelled()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            var bookings = new List<Booking>
    {
        new Booking
        {
            Id = bookingId,
            CustomerId = customerId,
            DesiredDate = DateTime.UtcNow,
            Status = BookingStatus.Completed,
            DateCreated = DateTime.UtcNow,
            DateModified = DateTime.UtcNow,
            Customer = new AppUser { Id = customerId, UserName = "Customer", IsActive = true },
            Payments = new List<Payment>(),
            Feedbacks = new List<BookingFeedback>(),
            Cancellation = null
        }
    };

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            var service = CreateService();

            // Act
            var result = await service.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.Null(result.Cancellation);
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

        // ================== CANCEL BOOKING - EMAIL SENDING ==================

        [Fact]
        public async Task CancelBookingAsync_ShouldSendEmail_WhenCustomerHasEmail()
        {
            // Arrange
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();
            var desiredDate = DateTime.UtcNow.AddDays(1);
            var serviceId = Guid.NewGuid();

            var customer = new AppUser
            {
                Id = customerId,
                Email = "customer@test.com",
                FullName = "John Doe",
                UserName = "johndoe",
                IsActive = true
            };

            var service = new Core.Entities.Service
            {
                Id = serviceId,
                Name = "Plumbing Service"
            };

            var bookingItem = new BookingItem
            {
                Id = Guid.NewGuid(),
                BookingId = bookingId,
                ServiceId = serviceId,
                Service = service,
                Price = 100
            };

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = technicianId,
                CustomerId = customerId,
                Status = BookingStatus.Confirmed,
                DesiredDate = desiredDate,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                Customer = customer,
                Items = new List<BookingItem> { bookingItem }
            };

            var bookings = new List<Booking> { booking }.BuildMock();

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);

            var technicianProfile = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                CitizenId = "123456789012",
                User = new AppUser { Id = userId }
            };

            var techs = new List<TechnicianProfile> { technicianProfile }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            _mockEmailService.Setup(e => e.SendEmailAsync(It.IsAny<EmailDto>()))
                .Returns(Task.CompletedTask);

            var bookingService = CreateService();
            var input = new CancelBookingDto
            {
                BookingId = bookingId,
                Reason = "Unable to attend"
            };

            // Act
            var result = await bookingService.CancelBookingAsync(input, userId.ToString());

            // Assert
            Assert.True(result);

            _mockEmailService.Verify(e => e.SendEmailAsync(It.Is<EmailDto>(dto =>
                dto.ToEmail == "customer@test.com" &&
                dto.Subject == "⚠️ Thông báo hủy lịch hẹn - HomeService Platform" &&
                dto.HtmlBody.Contains("John Doe") &&
                dto.HtmlBody.Contains("Unable to attend")
            )), Times.Once);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldNotSendEmail_WhenCustomerEmailIsNull()
        {
            // Arrange
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            var customer = new AppUser
            {
                Id = customerId,
                Email = null,
                FullName = "John Doe",
                UserName = "johndoe",
                IsActive = true
            };

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = technicianId,
                CustomerId = customerId,
                Status = BookingStatus.Confirmed,
                DesiredDate = DateTime.UtcNow,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                Customer = customer,
                Items = new List<BookingItem>()
            };

            var bookings = new List<Booking> { booking }.BuildMock();

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);

            var technicianProfile = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                CitizenId = "123456789012",
                User = new AppUser { Id = userId }
            };

            var techs = new List<TechnicianProfile> { technicianProfile }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var bookingService = CreateService();
            var input = new CancelBookingDto
            {
                BookingId = bookingId,
                Reason = "Unable to attend"
            };

            // Act
            var result = await bookingService.CancelBookingAsync(input, userId.ToString());

            // Assert
            Assert.True(result);
            _mockEmailService.Verify(e => e.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldNotSendEmail_WhenCustomerEmailIsEmpty()
        {
            // Arrange
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            var customer = new AppUser
            {
                Id = customerId,
                Email = "",
                FullName = "John Doe",
                UserName = "johndoe",
                IsActive = true
            };

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = technicianId,
                CustomerId = customerId,
                Status = BookingStatus.Confirmed,
                DesiredDate = DateTime.UtcNow,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                Customer = customer,
                Items = new List<BookingItem>()
            };

            var bookings = new List<Booking> { booking }.BuildMock();

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);

            var technicianProfile = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                CitizenId = "123456789012",
                User = new AppUser { Id = userId }
            };

            var techs = new List<TechnicianProfile> { technicianProfile }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var bookingService = CreateService();
            var input = new CancelBookingDto
            {
                BookingId = bookingId,
                Reason = "Unable to attend"
            };

            // Act
            var result = await bookingService.CancelBookingAsync(input, userId.ToString());

            // Assert
            Assert.True(result);
            _mockEmailService.Verify(e => e.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldNotSendEmail_WhenCustomerIsNull()
        {
            // Arrange
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = technicianId,
                CustomerId = Guid.NewGuid(),
                Status = BookingStatus.Confirmed,
                DesiredDate = DateTime.UtcNow,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                Customer = null,
                Items = new List<BookingItem>()
            };

            var bookings = new List<Booking> { booking }.BuildMock();

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);

            var technicianProfile = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                CitizenId = "123456789012",
                User = new AppUser { Id = userId }
            };

            var techs = new List<TechnicianProfile> { technicianProfile }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var bookingService = CreateService();
            var input = new CancelBookingDto
            {
                BookingId = bookingId,
                Reason = "Unable to attend"
            };

            // Act
            var result = await bookingService.CancelBookingAsync(input, userId.ToString());

            // Assert
            Assert.True(result);
            _mockEmailService.Verify(e => e.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldStillSucceed_WhenEmailSendingFails()
        {
            // Arrange
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            var customer = new AppUser
            {
                Id = customerId,
                Email = "customer@test.com",
                FullName = "John Doe",
                UserName = "johndoe",
                IsActive = true
            };

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = technicianId,
                CustomerId = customerId,
                Status = BookingStatus.Confirmed,
                DesiredDate = DateTime.UtcNow,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                Customer = customer,
                Items = new List<BookingItem>()
            };

            var bookings = new List<Booking> { booking }.BuildMock();

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);

            var technicianProfile = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                CitizenId = "123456789012",
                User = new AppUser { Id = userId }
            };

            var techs = new List<TechnicianProfile> { technicianProfile }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            _mockEmailService.Setup(e => e.SendEmailAsync(It.IsAny<EmailDto>()))
                .ThrowsAsync(new Exception("Email service unavailable"));

            var bookingService = CreateService();
            var input = new CancelBookingDto
            {
                BookingId = bookingId,
                Reason = "Unable to attend"
            };

            // Act
            var result = await bookingService.CancelBookingAsync(input, userId.ToString());

            // Assert
            Assert.True(result); // Should still succeed even if email fails
            Assert.Equal(BookingStatus.Cancelled, booking.Status);
            Assert.NotNull(booking.Cancellation);
        }

        [Fact]
        public async Task CancelBookingAsync_EmailTemplate_ShouldContainAllRequiredInformation()
        {
            // Arrange
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();
            var desiredDate = new DateTime(2024, 12, 25, 14, 30, 0);

            var customer = new AppUser
            {
                Id = customerId,
                Email = "customer@test.com",
                FullName = "John Doe",
                UserName = "johndoe",
                IsActive = true
            };

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = technicianId,
                CustomerId = customerId,
                Status = BookingStatus.Confirmed,
                DesiredDate = desiredDate,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                Customer = customer,
                Items = new List<BookingItem>()
            };

            var bookings = new List<Booking> { booking }.BuildMock();

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);

            var technicianProfile = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                CitizenId = "123456789012",
                User = new AppUser { Id = userId }
            };

            var techs = new List<TechnicianProfile> { technicianProfile }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            string capturedEmailBody = null;
            _mockEmailService.Setup(e => e.SendEmailAsync(It.IsAny<EmailDto>()))
                .Callback<EmailDto>(dto => capturedEmailBody = dto.HtmlBody)
                .Returns(Task.CompletedTask);

            var bookingService = CreateService();
            var input = new CancelBookingDto
            {
                BookingId = bookingId,
                Reason = "Emergency situation"
            };

            // Act
            var result = await bookingService.CancelBookingAsync(input, userId.ToString());

            // Assert
            Assert.True(result);
            Assert.NotNull(capturedEmailBody);
            Assert.Contains("John Doe", capturedEmailBody);
            Assert.Contains("25/12/2024 14:30", capturedEmailBody);
            Assert.Contains("Emergency situation", capturedEmailBody);
            Assert.Contains("Thông báo hủy lịch hẹn", capturedEmailBody);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldUseUserNameAsFallback_WhenFullNameIsNull()
        {
            // Arrange
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            var customer = new AppUser
            {
                Id = customerId,
                Email = "customer@test.com",
                FullName = null,
                UserName = "johndoe",
                IsActive = true
            };

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = technicianId,
                CustomerId = customerId,
                Status = BookingStatus.Confirmed,
                DesiredDate = DateTime.UtcNow,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                Customer = customer,
                Items = new List<BookingItem>()
            };

            var bookings = new List<Booking> { booking }.BuildMock();

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);

            var technicianProfile = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                CitizenId = "123456789012",
                User = new AppUser { Id = userId }
            };

            var techs = new List<TechnicianProfile> { technicianProfile }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            string capturedEmailBody = null;
            _mockEmailService.Setup(e => e.SendEmailAsync(It.IsAny<EmailDto>()))
                .Callback<EmailDto>(dto => capturedEmailBody = dto.HtmlBody)
                .Returns(Task.CompletedTask);

            var bookingService = CreateService();
            var input = new CancelBookingDto
            {
                BookingId = bookingId,
                Reason = "Test"
            };

            // Act
            var result = await bookingService.CancelBookingAsync(input, userId.ToString());

            // Assert
            Assert.True(result);
            Assert.Contains("johndoe", capturedEmailBody); // Should use username
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldReturnFalse_WhenTechnicianProfileNotFound()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = technicianId,
                Status = BookingStatus.Confirmed,
                CustomerId = Guid.NewGuid(),
                DesiredDate = DateTime.UtcNow
            };

            var bookings = new List<Booking> { booking }.BuildMock();

            _mockBookingRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings);

            var techs = new List<TechnicianProfile>().BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(techs);

            var bookingService = CreateService();
            var input = new CancelBookingDto
            {
                BookingId = bookingId,
                Reason = "Test"
            };

            // Act
            var result = await bookingService.CancelBookingAsync(input, Guid.NewGuid().ToString());

            // Assert
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

            _mockRedisService.Setup(r => r.GetAsync<string>($"waiting_{token}"))
                .ReturnsAsync("exists");

            _mockRedisService.Setup(r => r.GetAsync<Guid>($"accept_{token}"))
                .ReturnsAsync(technicianId);

            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = technicianUserId,
                User = new AppUser
                {
                    Id = technicianUserId,
                    FullName = "Tech Full Name"
                },
                Services = new List<Core.Entities.Service>
    {
        new Core.Entities.Service
        {
            Id = serviceId,
            Name = "Test Service",
            Price = 100
        }
    }
            };


            _mockTechnicianRepo.Setup(r => r.GetAll())
                .Returns(new List<TechnicianProfile> { technician }
                    .BuildMockDbSet().Object);

            var customer = new AppUser
            {
                Id = customerId,
                FullName = "Customer Name"
            };

            _mockUserRepo.Setup(r => r.FindByIdAsync(customerId))
                .ReturnsAsync(customer);

            var service = new Core.Entities.Service
            {
                Id = serviceId,
                Name = "Test Service",
                Price = 100
            };

            _mockServiceRepo.Setup(r => r.GetAll())
                .Returns(new List<Core.Entities.Service> { service }
                    .BuildMockDbSet().Object);

            _mockBookingRepo.Setup(r => r.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);

            _mockBookingItemRepo.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<BookingItem>>()))
                .Returns(Task.CompletedTask);

            _mockConversationRepo.Setup(r => r.AddAsync(It.IsAny<ChatConversation>()))
                .ReturnsAsync((ChatConversation c) => c);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);
            var mockTransaction = new Mock<IDbContextTransaction>();
            mockTransaction.Setup(t => t.CommitAsync(It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
            mockTransaction.Setup(t => t.RollbackAsync(It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _mockUnitOfWork.Setup(u => u.BeginTransactionAsync())
                .ReturnsAsync(mockTransaction.Object);

            var bookingService = CreateService();

            var result = await bookingService.AcceptBookingEmailAsync(
                customerId,
                technicianId,
                new List<Guid> { serviceId },
                token,
                desiredDate
            );

            Assert.True(result.IsSuccess);
            Assert.Equal("Xác nhận thành công!", result.Message);

            _mockBookingRepo.Verify(r => r.AddAsync(It.IsAny<Booking>()), Times.Once);
            _mockBookingItemRepo.Verify(r => r.AddRangeAsync(It.IsAny<IEnumerable<BookingItem>>()), Times.Once);
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

        // ================== ACCEPT BOOKING EMAIL - EDGE CASES ==================

        [Fact]
        public async Task AcceptBookingEmailAsync_ShouldReturnFailure_WhenTokenIsEmpty()
        {
            // Arrange
            var service = CreateService();
            var token = Guid.Empty.ToString();

            _mockRedisService.Setup(r => r.GetAsync<Guid>($"accept_{token}"))
                .ReturnsAsync(Guid.Empty);

            // Act
            var result = await service.AcceptBookingEmailAsync(
                Guid.NewGuid(), Guid.NewGuid(), new List<Guid>(), token, DateTime.UtcNow);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Token không hợp lệ hoặc kỹ thuật viên không khớp.", result.Message);
        }

        [Fact]
        public async Task AcceptBookingEmailAsync_ShouldReturnFailure_WhenServicesListIsEmpty()
        {
            // Arrange
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
                User = new AppUser { Id = technicianUserId },
                Services = new List<Core.Entities.Service>()
            };
            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockTechnicianRepo.Setup(r => r.GetAll()).Returns(technicians);

            var customer = new AppUser { Id = customerId };
            _mockUserRepo.Setup(r => r.FindByIdAsync(customerId)).ReturnsAsync(customer);

            var services = new List<Core.Entities.Service>().BuildMock();
            _mockServiceRepo.Setup(r => r.GetAll()).Returns(services);

            var bookingService = CreateService();

            // Act
            var result = await bookingService.AcceptBookingEmailAsync(
                customerId, technicianId, new List<Guid>(), token, DateTime.UtcNow);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Không tìm thấy dịch vụ hợp lệ.", result.Message);
        }

        [Fact]
        public async Task AcceptBookingEmailAsync_ShouldFilterServices_ByTechnicianAvailableServices()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();
            var technicianUserId = Guid.NewGuid();
            var serviceId1 = Guid.NewGuid();
            var serviceId2 = Guid.NewGuid();
            var serviceId3 = Guid.NewGuid(); // Not in technician services
            var token = "valid-token";

            _mockRedisService.Setup(r => r.GetAsync<string>($"waiting_{token}")).ReturnsAsync("exists");
            _mockRedisService.Setup(r => r.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(technicianId);

            var technicianServices = new List<Core.Entities.Service>
    {
        new Core.Entities.Service { Id = serviceId1, Name = "Service 1", Price = 100 },
        new Core.Entities.Service { Id = serviceId2, Name = "Service 2", Price = 200 }
    };

            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = technicianUserId,
                CitizenId = "123456789012",
                User = new AppUser { Id = technicianUserId },
                Services = technicianServices
            };

            _mockTechnicianRepo.Setup(r => r.GetAll())
                .Returns(new List<TechnicianProfile> { technician }.BuildMockDbSet().Object);

            var customer = new AppUser { Id = customerId };
            _mockUserRepo.Setup(r => r.FindByIdAsync(customerId)).ReturnsAsync(customer);

            var allServices = new List<Core.Entities.Service>
    {
        new Core.Entities.Service { Id = serviceId1, Name = "Service 1", Price = 100 },
        new Core.Entities.Service { Id = serviceId2, Name = "Service 2", Price = 200 },
        new Core.Entities.Service { Id = serviceId3, Name = "Service 3", Price = 300 }
    };

            _mockServiceRepo.Setup(r => r.GetAll())
                .Returns(allServices.BuildMockDbSet().Object);

            List<BookingItem> capturedItems = null;
            _mockBookingItemRepo.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<BookingItem>>()))
                .Callback<IEnumerable<BookingItem>>(items => capturedItems = items.ToList())
                .Returns(Task.CompletedTask);

            _mockBookingRepo.Setup(r => r.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);

            _mockConversationRepo.Setup(r => r.AddAsync(It.IsAny<ChatConversation>()))
                .ReturnsAsync((ChatConversation c) => c);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var mockTransaction = new Mock<IDbContextTransaction>();
            mockTransaction.Setup(t => t.CommitAsync(It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _mockUnitOfWork.Setup(u => u.BeginTransactionAsync())
                .ReturnsAsync(mockTransaction.Object);

            var bookingService = CreateService();

            // Act - Request all 3 services but only 2 should be added
            var result = await bookingService.AcceptBookingEmailAsync(
                customerId, technicianId,
                new List<Guid> { serviceId1, serviceId2, serviceId3 },
                token, DateTime.UtcNow);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(capturedItems);
            Assert.Equal(2, capturedItems.Count); // Only service1 and service2
            Assert.Contains(capturedItems, i => i.ServiceId == serviceId1);
            Assert.Contains(capturedItems, i => i.ServiceId == serviceId2);
            Assert.DoesNotContain(capturedItems, i => i.ServiceId == serviceId3);
        }

        [Fact]
        public async Task AcceptBookingEmailAsync_ShouldRollbackTransaction_OnException()
        {
            // Arrange
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
                User = new AppUser { Id = technicianUserId },
                Services = new List<Core.Entities.Service>
        {
            new Core.Entities.Service { Id = serviceId, Name = "Test Service", Price = 100 }
        }
            };

            _mockTechnicianRepo.Setup(r => r.GetAll())
                .Returns(new List<TechnicianProfile> { technician }.BuildMockDbSet().Object);

            var customer = new AppUser { Id = customerId };
            _mockUserRepo.Setup(r => r.FindByIdAsync(customerId)).ReturnsAsync(customer);

            var service = new Core.Entities.Service { Id = serviceId, Name = "Test Service", Price = 100 };
            _mockServiceRepo.Setup(r => r.GetAll())
                .Returns(new List<Core.Entities.Service> { service }.BuildMockDbSet().Object);

            _mockBookingRepo.Setup(r => r.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);

            _mockBookingItemRepo.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<BookingItem>>()))
                .Returns(Task.CompletedTask);

            // Throw exception when saving changes
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync())
                .ThrowsAsync(new Exception("Database error"));

            var mockTransaction = new Mock<IDbContextTransaction>();
            mockTransaction.Setup(t => t.RollbackAsync(It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _mockUnitOfWork.Setup(u => u.BeginTransactionAsync())
                .ReturnsAsync(mockTransaction.Object);

            var bookingService = CreateService();

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(async () =>
                await bookingService.AcceptBookingEmailAsync(
                    customerId, technicianId, new List<Guid> { serviceId }, token, DateTime.UtcNow));

            mockTransaction.Verify(t => t.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task AcceptBookingEmailAsync_ShouldCreateBookingWithCorrectStatus()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();
            var technicianUserId = Guid.NewGuid();
            var serviceId = Guid.NewGuid();
            var token = "valid-token";
            var desiredDate = DateTime.UtcNow.AddDays(1);

            _mockRedisService.Setup(r => r.GetAsync<string>($"waiting_{token}")).ReturnsAsync("exists");
            _mockRedisService.Setup(r => r.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(technicianId);

            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = technicianUserId,
                CitizenId = "123456789012",
                User = new AppUser { Id = technicianUserId },
                Services = new List<Core.Entities.Service>
        {
            new Core.Entities.Service { Id = serviceId, Name = "Test Service", Price = 100 }
        }
            };

            _mockTechnicianRepo.Setup(r => r.GetAll())
                .Returns(new List<TechnicianProfile> { technician }.BuildMockDbSet().Object);

            var customer = new AppUser { Id = customerId };
            _mockUserRepo.Setup(r => r.FindByIdAsync(customerId)).ReturnsAsync(customer);

            var service = new Core.Entities.Service { Id = serviceId, Name = "Test Service", Price = 100 };
            _mockServiceRepo.Setup(r => r.GetAll())
                .Returns(new List<Core.Entities.Service> { service }.BuildMockDbSet().Object);

            Booking capturedBooking = null;
            _mockBookingRepo.Setup(r => r.AddAsync(It.IsAny<Booking>()))
                .Callback<Booking>(b => capturedBooking = b)
                .ReturnsAsync((Booking b) => b);

            _mockBookingItemRepo.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<BookingItem>>()))
                .Returns(Task.CompletedTask);

            _mockConversationRepo.Setup(r => r.AddAsync(It.IsAny<ChatConversation>()))
                .ReturnsAsync((ChatConversation c) => c);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var mockTransaction = new Mock<IDbContextTransaction>();
            mockTransaction.Setup(t => t.CommitAsync(It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _mockUnitOfWork.Setup(u => u.BeginTransactionAsync())
                .ReturnsAsync(mockTransaction.Object);

            var bookingService = CreateService();

            // Act
            var result = await bookingService.AcceptBookingEmailAsync(
                customerId, technicianId, new List<Guid> { serviceId }, token, desiredDate);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(capturedBooking);
            Assert.Equal(customerId, capturedBooking.CustomerId);
            Assert.Equal(technicianId, capturedBooking.TechnicianId);
            Assert.Equal(desiredDate, capturedBooking.DesiredDate);
            Assert.Equal(BookingStatus.Pending, capturedBooking.Status);
        }

        [Fact]
        public async Task AcceptBookingEmailAsync_ShouldCreateChatConversation()
        {
            // Arrange
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
                User = new AppUser { Id = technicianUserId },
                Services = new List<Core.Entities.Service>
        {
            new Core.Entities.Service { Id = serviceId, Name = "Test Service", Price = 100 }
        }
            };

            _mockTechnicianRepo.Setup(r => r.GetAll())
                .Returns(new List<TechnicianProfile> { technician }.BuildMockDbSet().Object);

            var customer = new AppUser { Id = customerId };
            _mockUserRepo.Setup(r => r.FindByIdAsync(customerId)).ReturnsAsync(customer);

            var service = new Core.Entities.Service { Id = serviceId, Name = "Test Service", Price = 100 };
            _mockServiceRepo.Setup(r => r.GetAll())
                .Returns(new List<Core.Entities.Service> { service }.BuildMockDbSet().Object);

            _mockBookingRepo.Setup(r => r.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);

            _mockBookingItemRepo.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<BookingItem>>()))
                .Returns(Task.CompletedTask);

            ChatConversation capturedConversation = null;
            _mockConversationRepo.Setup(r => r.AddAsync(It.IsAny<ChatConversation>()))
                .Callback<ChatConversation>(c => capturedConversation = c)
                .ReturnsAsync((ChatConversation c) => c);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var mockTransaction = new Mock<IDbContextTransaction>();
            mockTransaction.Setup(t => t.CommitAsync(It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _mockUnitOfWork.Setup(u => u.BeginTransactionAsync())
                .ReturnsAsync(mockTransaction.Object);

            var bookingService = CreateService();

            // Act
            var result = await bookingService.AcceptBookingEmailAsync(
                customerId, technicianId, new List<Guid> { serviceId }, token, DateTime.UtcNow);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(capturedConversation);
            Assert.Equal(customerId, capturedConversation.CustomerId);
            Assert.Equal(technicianId, capturedConversation.TechnicianId);
            _mockConversationRepo.Verify(r => r.AddAsync(It.IsAny<ChatConversation>()), Times.Once);
        }

        [Fact]
        public async Task AcceptBookingEmailAsync_ShouldManageRedisTokens_Correctly()
        {
            // Arrange
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
                User = new AppUser { Id = technicianUserId },
                Services = new List<Core.Entities.Service>
        {
            new Core.Entities.Service { Id = serviceId, Name = "Test Service", Price = 100 }
        }
            };

            _mockTechnicianRepo.Setup(r => r.GetAll())
                .Returns(new List<TechnicianProfile> { technician }.BuildMockDbSet().Object);

            var customer = new AppUser { Id = customerId };
            _mockUserRepo.Setup(r => r.FindByIdAsync(customerId)).ReturnsAsync(customer);

            var service = new Core.Entities.Service { Id = serviceId, Name = "Test Service", Price = 100 };
            _mockServiceRepo.Setup(r => r.GetAll())
                .Returns(new List<Core.Entities.Service> { service }.BuildMockDbSet().Object);

            _mockBookingRepo.Setup(r => r.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);

            _mockBookingItemRepo.Setup(r => r.AddRangeAsync(It.IsAny<IEnumerable<BookingItem>>()))
                .Returns(Task.CompletedTask);

            _mockConversationRepo.Setup(r => r.AddAsync(It.IsAny<ChatConversation>()))
                .ReturnsAsync((ChatConversation c) => c);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var mockTransaction = new Mock<IDbContextTransaction>();
            mockTransaction.Setup(t => t.CommitAsync(It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _mockUnitOfWork.Setup(u => u.BeginTransactionAsync())
                .ReturnsAsync(mockTransaction.Object);

            var bookingService = CreateService();

            // Act
            var result = await bookingService.AcceptBookingEmailAsync(
                customerId, technicianId, new List<Guid> { serviceId }, token, DateTime.UtcNow);

            // Assert
            Assert.True(result.IsSuccess);

            // Verify waiting token is removed
            _mockRedisService.Verify(r => r.RemoveAsync($"waiting_{token}"), Times.Once);

            // Verify accepted token is set with 60 seconds expiration
            _mockRedisService.Verify(r => r.SetAsync($"accepted_{token}", technician.Id, TimeSpan.FromSeconds(60)), Times.Once);
        }
    }
}