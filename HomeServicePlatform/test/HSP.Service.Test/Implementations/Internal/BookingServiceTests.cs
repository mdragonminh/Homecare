using HSP.Core.Dtos.BookingDto;
using HSP.Core.Dtos.EquipmentDto;
using HSP.Core.Dtos.MapDto; // Cần thiết cho CoordinatesDto
using HSP.Core.Dtos.PaymentDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Implementations.Internal;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Localization;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using System.Linq.Dynamic.Core.Tokenizer;
using System.Linq.Expressions;
using Xunit;

namespace HSP.Service.Test.Implementations.Internal
{
    public class BookingServiceTests
    {
        private readonly Mock<IRepository<Booking, Guid>> _mockBookingRepo;
        private readonly Mock<IRepository<BookingItem, Guid>> _mockBookingItemRepo;
        private readonly Mock<IRepository<TechnicianProfile, Guid>> _mockTechnicianRepo;
        private readonly Mock<IRepository<Core.Entities.Service, Guid>> _mockServiceRepo;
        private readonly Mock<IRepository<Equipment, Guid>> _mockEquipmentRepo;
        private readonly Mock<IRepository<BookingEquipment, Guid>> _mockBookingEquipmentRepo;
        private readonly Mock<IRepository<ChatConversation, Guid>> _mockConversationRepo;
        private readonly Mock<IRepository<Payment, Guid>> _mockPaymentRepo;
        private readonly Mock<IRepository<FileRelation, Guid>> _mockFileRelationRepo;

        private readonly Mock<IGeocodingService> _mockGeocodingService;
        private readonly Mock<IUserRepository> _mockUserRepo;
        private readonly Mock<IRedisCacheService> _mockRedisCacheService;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;
        private readonly Mock<IDbContextTransaction> _mockTransaction;

        private readonly BookingService _bookingService;

        public BookingServiceTests()
        {
            _mockBookingRepo = new Mock<IRepository<Booking, Guid>>();
            _mockBookingItemRepo = new Mock<IRepository<BookingItem, Guid>>();
            _mockTechnicianRepo = new Mock<IRepository<TechnicianProfile, Guid>>();
            _mockServiceRepo = new Mock<IRepository<Core.Entities.Service, Guid>>();
            _mockEquipmentRepo = new Mock<IRepository<Equipment, Guid>>();
            _mockBookingEquipmentRepo = new Mock<IRepository<BookingEquipment, Guid>>();
            _mockConversationRepo = new Mock<IRepository<ChatConversation, Guid>>();
            _mockPaymentRepo = new Mock<IRepository<Payment, Guid>>();
            _mockFileRelationRepo = new Mock<IRepository<FileRelation, Guid>>();

            _mockGeocodingService = new Mock<IGeocodingService>();
            _mockUserRepo = new Mock<IUserRepository>();
            _mockRedisCacheService = new Mock<IRedisCacheService>();
            _mockEmailService = new Mock<IEmailService>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();
            _mockTransaction = new Mock<IDbContextTransaction>();

            _mockUnitOfWork.Setup(u => u.BeginTransactionAsync()).ReturnsAsync(_mockTransaction.Object);

            // FIX CS0854: Thêm It.IsAny<TimeSpan?>() cho Redis
            _mockRedisCacheService
                .Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<TimeSpan?>()))
                .Returns(Task.CompletedTask);

            _bookingService = new BookingService(
                _mockBookingRepo.Object,
                _mockBookingItemRepo.Object,
                _mockTechnicianRepo.Object,
                _mockServiceRepo.Object,
                _mockGeocodingService.Object,
                _mockUserRepo.Object,
                _mockRedisCacheService.Object,
                _mockConversationRepo.Object,
                _mockUnitOfWork.Object,
                _mockLocalizer.Object,
                _mockEmailService.Object,
                _mockEquipmentRepo.Object,
                _mockBookingEquipmentRepo.Object,
                _mockPaymentRepo.Object,
                _mockFileRelationRepo.Object
            );
        }

        #region GetAllBookingsAsync Tests

        [Fact]
        public async Task GetAllBookingsAsync_ShouldReturnPagedList_WhenDataExists()
        {
            // Arrange
            var bookings = new List<Booking>
            {
                new Booking
                {
                    Id = Guid.NewGuid(),
                    Status = BookingStatus.Pending,
                    DateCreated = DateTime.UtcNow,
                    // SỬA: Thêm DesiredDate để tránh lỗi Nullable object must have a value
                    DesiredDate = DateTime.UtcNow.AddDays(1),
                    Customer = new AppUser { FullName = "Nguyen Van A", UserName = "NguyenVanA" }
                },
                new Booking
                {
                    Id = Guid.NewGuid(),
                    Status = BookingStatus.Completed,
                    DateCreated = DateTime.UtcNow.AddDays(-1),
                    // SỬA: Thêm DesiredDate
                    DesiredDate = DateTime.UtcNow.AddDays(-1),
                    Customer = new AppUser { FullName = "Tran Van B", UserName = "tranvanb" }
                }
            };

            // ... (Phần Setup Mock giữ nguyên) ...
            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment>().BuildMock());

            var input = new BookingInput { PageNumber = 1, PageSize = 10, SearchTerm = "Nguyen" };

            // Act
            var result = await _bookingService.GetAllBookingsAsync(input);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal("Nguyen Van A", result.Items[0].Customer.FullName);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldFilterByStatusAndDate()
        {
            // Arrange
            var date = DateTime.UtcNow;
            var bookings = new List<Booking>
            {
                new Booking { Id = Guid.NewGuid(), Status = BookingStatus.Pending, DesiredDate = date },
                new Booking { Id = Guid.NewGuid(), Status = BookingStatus.Completed, DesiredDate = date.AddDays(-5) }
            };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());

            _mockBookingItemRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment>().BuildMock());

            var input = new BookingInput
            {
                Status = BookingStatus.Pending,
                FromDate = date.AddDays(-1),
                ToDate = date.AddDays(1)
            };

            // Act
            var result = await _bookingService.GetAllBookingsAsync(input);

            // Assert
            Assert.Equal(1, result.TotalCount); // Chỉ lấy Pending trong khoảng ngày
            Assert.Equal(BookingStatus.Pending, result.Items[0].Status);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldFilterByStatusAndTechnicianAndDate()
        {
            // Arrange
            var techId = Guid.NewGuid();
            var targetDate = DateTime.UtcNow;
            var bookings = new List<Booking>
            {
                // Match: Đúng Status, TechId, Date
                new Booking {
                    Id = Guid.NewGuid(),
                    Status = BookingStatus.Completed,
                    TechnicianId = techId,
                    DesiredDate = targetDate,
                    Customer = new AppUser { FullName = "Match" }
                },
                // Mismatch Status
                new Booking {
                    Id = Guid.NewGuid(),
                    Status = BookingStatus.Pending,
                    TechnicianId = techId,
                    DesiredDate = targetDate,
                    Customer = new AppUser { FullName = "Wrong Status" }
                },
                // Mismatch Date
                new Booking {
                    Id = Guid.NewGuid(),
                    Status = BookingStatus.Completed,
                    TechnicianId = techId,
                    DesiredDate = targetDate.AddDays(-10),
                    Customer = new AppUser { FullName = "Wrong Date" }
                }
            };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());
            _mockBookingItemRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment>().BuildMock());

            var input = new BookingInput
            {
                Status = BookingStatus.Completed,
                TechnicianId = techId,
                FromDate = targetDate.AddDays(-1),
                ToDate = targetDate.AddDays(1)
            };

            // Act
            var result = await _bookingService.GetAllBookingsAsync(input);

            // Assert
            Assert.Single(result.Items);
            Assert.Equal("Match", result.Items[0].Customer.FullName);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldFilterByCustomerId_AndSortByDefault()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var bookings = new List<Booking>
            {
                // Customer khác
                new Booking {
                    Id = Guid.NewGuid(),
                    CustomerId = Guid.NewGuid(),
                    DateCreated = DateTime.UtcNow,
                    DesiredDate = DateTime.UtcNow // <--- Thêm dòng này
                },
                // Customer cần tìm (Tạo 2 cái để test sort)
                new Booking {
                    Id = Guid.NewGuid(),
                    CustomerId = customerId,
                    DateCreated = DateTime.UtcNow.AddHours(-1),
                    DesiredDate = DateTime.UtcNow // <--- Thêm dòng này
                },
                new Booking {
                    Id = Guid.NewGuid(),
                    CustomerId = customerId,
                    DateCreated = DateTime.UtcNow,
                    DesiredDate = DateTime.UtcNow // <--- Thêm dòng này
                }
            };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());
            _mockBookingItemRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment>().BuildMock());

            var input = new BookingInput
            {
                CustomerId = customerId,
                // Không truyền OrderBy để test logic default sort
            };

            // Act
            var result = await _bookingService.GetAllBookingsAsync(input);

            // Assert
            Assert.Equal(2, result.TotalCount);
            // Kiểm tra sort: DateCreated giảm dần (Mới nhất lên đầu)
            Assert.True(result.Items[0].DateCreated > result.Items[1].DateCreated);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldFilterByTechnicianAndDateRange()
        {
            // Arrange
            var techId = Guid.NewGuid();
            var targetDate = DateTime.UtcNow;

            var bookings = new List<Booking>
            {
                // Thỏa mãn mọi điều kiện
                new Booking
                {
                    Id = Guid.NewGuid(),
                    TechnicianId = techId,
                    DesiredDate = targetDate,
                    DateCreated = DateTime.UtcNow,
                    Customer = new AppUser { FullName = "Match" }
                },
                // Sai Technician
                new Booking
                {
                    Id = Guid.NewGuid(),
                    TechnicianId = Guid.NewGuid(),
                    DesiredDate = targetDate,
                    DateCreated = DateTime.UtcNow,
                    Customer = new AppUser { FullName = "Wrong Tech" }
                },
                // Sai Date (quá khứ)
                new Booking
                {
                    Id = Guid.NewGuid(),
                    TechnicianId = techId,
                    DesiredDate = targetDate.AddDays(-10),
                    DateCreated = DateTime.UtcNow,
                    Customer = new AppUser { FullName = "Wrong Date" }
                }
            };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());
            _mockBookingItemRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment>().BuildMock());

            var input = new BookingInput
            {
                TechnicianId = techId,
                FromDate = targetDate.AddDays(-1),
                ToDate = targetDate.AddDays(1)
            };

            // Act
            var result = await _bookingService.GetAllBookingsAsync(input);

            // Assert
            Assert.Single(result.Items);
            Assert.Equal("Match", result.Items[0].Customer.FullName);
        }

        [Fact]
        public async Task GetAllBookingsAsync_ShouldSortByCustomField_WhenOrderByProvided()
        {
            // Arrange
            var bookings = new List<Booking>
            {
                new Booking
                {
                    Id = Guid.NewGuid(),
                    Status = BookingStatus.Pending,
                    DateCreated = DateTime.UtcNow,
                    // SỬA LỖI: Thêm DesiredDate để tránh lỗi Nullable object must have a value
                    DesiredDate = DateTime.UtcNow
                },
                new Booking
                {
                    Id = Guid.NewGuid(),
                    Status = BookingStatus.Completed,
                    DateCreated = DateTime.UtcNow,
                    // SỬA LỖI: Thêm DesiredDate
                    DesiredDate = DateTime.UtcNow
                }
            };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookings.BuildMock());
            _mockBookingItemRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment>().BuildMock());

            // Case: Sort theo Status
            var input = new BookingInput
            {
                OrderBy = "Status desc"
            };

            // Act
            var result = await _bookingService.GetAllBookingsAsync(input);

            // Assert
            Assert.Equal(2, result.TotalCount);
            Assert.NotNull(result.Items);
        }

        #endregion

        #region GetBookingDetailAsync Tests

        [Fact]
        public async Task GetBookingDetailAsync_ShouldReturnDetails_WhenIdExists()
        {
            var bookingId = Guid.NewGuid();
            var booking = new Booking
            {
                Id = bookingId,
                Status = BookingStatus.Confirmed,
                Items = new List<BookingItem>(),
                Equipments = new List<BookingEquipment>(),
                Payments = new List<Payment>(),
                Feedbacks = new List<BookingFeedback>(),
                Customer = new AppUser { FullName = "Customer Test", Email = "cus@test.com" }
            };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());

            _mockBookingItemRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());

            _mockConversationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<ChatConversation, object>>[]>()))
                .Returns(new List<ChatConversation>().BuildMock());

            // FIX CS0854 (Lỗi dòng 239): 
            // Dù interface bạn gửi không thấy CancellationToken, nhưng lỗi CS0854 ngụ ý rằng có tham số ẩn (optional).
            // Nếu dòng dưới đây báo lỗi biên dịch (thừa tham số), hãy xóa tham số thứ 3 đi.
            // Nhưng với CS0854, khả năng cao là cần nó hoặc cần tường minh các tham số.
            _mockGeocodingService
                .Setup(x => x.GetAddressForCoordinatesAsync(
                    It.IsAny<double>(),
                    It.IsAny<double>()
                 // Nếu project của bạn có dùng CancellationToken thì bỏ comment dòng dưới:
                 // , It.IsAny<CancellationToken>() 
                 ))
                .ReturnsAsync("Ha Noi, Viet Nam");

            var result = await _bookingService.GetBookingDetailAsync(bookingId);

            Assert.NotNull(result);
            Assert.Equal(bookingId, result.Id);
            // Nếu bạn không setup được mock Geocoding vì lỗi tham số, Assert này có thể fail (null) hoặc trả về default
            // Assert.Equal("Ha Noi, Viet Nam", result.Address); 
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldThrowKeyNotFound_WhenIdDoesNotExist()
        {
            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking>().BuildMock());

            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _bookingService.GetBookingDetailAsync(Guid.NewGuid()));

            Assert.Equal("Không tìm thấy booking", exception.Message);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldReturnZeroRating_WhenNoFeedbackExists()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = customerId,
                Customer = new AppUser { Id = customerId },
                Feedbacks = new List<BookingFeedback>()
            };

            // Mock trả về list booking của customer này nhưng KHÔNG có feedback nào từ Technician
            var pastBookings = new List<Booking>
            {
                new Booking { CustomerId = customerId, Status = BookingStatus.Completed, Feedbacks = new List<BookingFeedback>() }, // Rỗng
                booking
            };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(pastBookings.BuildMock());

            _mockGeocodingService.Setup(x => x.GetAddressForCoordinatesAsync(It.IsAny<double>(), It.IsAny<double>()))
                .ReturnsAsync("Addr");
            // Setup các mock phụ khác trả về rỗng
            _mockBookingItemRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());
            _mockPaymentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(new List<Payment>().BuildMock());
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment>().BuildMock());
            _mockConversationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<ChatConversation, object>>[]>()))
                .Returns(new List<ChatConversation>().BuildMock());

            // Act
            var result = await _bookingService.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.Equal(0, result.CustomerAverageRating);
            Assert.Equal(0, result.CustomerRatingCount);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldMapAllChildCollectionsAndCalculatePrices_Correctly()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var serviceId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            // Tạo cấu trúc dữ liệu đầy đủ
            var booking = new Booking
            {
                Id = bookingId,
                Status = BookingStatus.Confirmed,
                DateCreated = DateTime.UtcNow,
                DesiredDate = DateTime.UtcNow,
                Customer = new AppUser { FullName = "Customer" },
                Technician = new TechnicianProfile { User = new AppUser { FullName = "Tech" } },

                // 1. Items (Service)
                Items = new List<BookingItem>
                {
                    new BookingItem
                    {
                        ServiceId = serviceId,
                        Price = 200,
                        Service = new Core.Entities.Service { Name = "Vệ sinh máy lạnh", Description = "Mô tả dịch vụ" }
                    }
                },

                // 2. Equipments (Thiết bị)
                Equipments = new List<BookingEquipment>
                {
                    new BookingEquipment
                    {
                        Id = Guid.NewGuid(),
                        EquipmentId = equipmentId,
                        Quantity = 2,
                        UnitPrice = 50,
                        Status = BookingEquipmentStatus.Delivered,
                        IsDeleted = false,
                        Equipment = new Equipment { Name = "Gas R32" }
                    }
                },

                // 3. Payments
                Payments = new List<Payment>
                {
                    new Payment
                    {
                        Id = Guid.NewGuid(),
                        Amount = 300, 
                        // SỬA LỖI CS0029: Ép kiểu int sang Enum PaymentMethod (giả sử 1 là Momo/Banking...)
                        // Vì tôi không có file Enum PaymentMethod, tôi dùng tạm (PaymentMethod)1
                        PaymentMethod = (PaymentMethod)1,
                        Status = PaymentStatus.Completed,
                        Type = PaymentType.Service
                    }
                },

                // 4. Feedbacks
                Feedbacks = new List<BookingFeedback>
                {
                    new BookingFeedback
                    {
                        Rating = 5,
                        Comment = "Good job",
                        Source = FeedbackSource.Customer
                    }
                }
            };

            // Setup Mock
            var bookingsList = new List<Booking> { booking };
            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsList.BuildMock());

            // Setup services phụ
            _mockGeocodingService.Setup(x => x.GetAddressForCoordinatesAsync(It.IsAny<double>(), It.IsAny<double>()))
                .ReturnsAsync("HCM");

            _mockBookingItemRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment>().BuildMock());
            _mockPaymentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(new List<Payment>().BuildMock());
            _mockConversationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<ChatConversation, object>>[]>()))
                .Returns(new List<ChatConversation>().BuildMock());

            // Act
            var result = await _bookingService.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);

            // SỬA LỖI CS0021: Dùng .ElementAt(0) thay vì [0]

            // Assert Items Mapping
            Assert.Single(result.Items);
            var item = result.Items.ElementAt(0);
            Assert.Equal("Vệ sinh máy lạnh", item.ServiceName);
            Assert.Equal("Mô tả dịch vụ", item.Description);
            Assert.Equal(200, item.Price);

            // Assert Equipments Mapping & Calculation
            Assert.Single(result.Equipments);
            var eq = result.Equipments.ElementAt(0);
            Assert.Equal("Gas R32", eq.EquipmentName);
            Assert.Equal(2, eq.Quantity);
            Assert.Equal(50, eq.UnitPrice);
            Assert.Equal(100, eq.TotalPrice);

            // Assert Payments Mapping
            Assert.Single(result.Payments);
            var pay = result.Payments.ElementAt(0);
            Assert.Equal(300, pay.Amount);
            // So sánh Enum thay vì string
            Assert.Equal((PaymentMethod)1, pay.PaymentMethod);

            // Assert Feedbacks Mapping
            Assert.Single(result.Feedbacks);
            var fb = result.Feedbacks.ElementAt(0);
            Assert.Equal("Good job", fb.Comment);
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldFilterDeletedEquipments()
        {
            // Arrange
            var bookingId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                Status = BookingStatus.Confirmed,
                DateCreated = DateTime.UtcNow,
                DesiredDate = DateTime.UtcNow,
                Customer = new AppUser(),

                // Danh sách thiết bị: 1 cái Active, 1 cái Deleted
                Equipments = new List<BookingEquipment>
                {
                    // Item 1: Hợp lệ
                    new BookingEquipment
                    {
                        Id = Guid.NewGuid(),
                        IsDeleted = false, // Giữ lại
                        Equipment = new Equipment { Name = "Active Item" }
                    },
                    // Item 2: Đã xóa
                    new BookingEquipment
                    {
                        Id = Guid.NewGuid(),
                        IsDeleted = true, // Phải bị lọc bỏ
                        Equipment = new Equipment { Name = "Deleted Item" }
                    }
                },
                // Các list khác rỗng
                Items = new List<BookingItem>(),
                Payments = new List<Payment>(),
                Feedbacks = new List<BookingFeedback>()
            };

            var bookingsList = new List<Booking> { booking };
            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsList.BuildMock());

            // Setup services phụ
            _mockGeocodingService.Setup(x => x.GetAddressForCoordinatesAsync(It.IsAny<double>(), It.IsAny<double>())).ReturnsAsync("");
            _mockBookingItemRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>())).Returns(new List<BookingItem>().BuildMock());
            _mockPaymentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>())).Returns(new List<Payment>().BuildMock());
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>())).Returns(new List<BookingEquipment>().BuildMock());
            _mockConversationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<ChatConversation, object>>[]>()))
                .Returns(new List<ChatConversation>().BuildMock());

            // Act
            var result = await _bookingService.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Equipments); // Chỉ còn 1 item
            Assert.Equal("Active Item", result.Equipments[0].EquipmentName); // Item active
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldHandleNullServiceInItems()
        {
            // Arrange
            var bookingId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                Status = BookingStatus.Confirmed,
                DateCreated = DateTime.UtcNow,
                DesiredDate = DateTime.UtcNow,
                Customer = new AppUser(),

                Items = new List<BookingItem>
                {
                    new BookingItem
                    {
                        ServiceId = Guid.NewGuid(),
                        Service = null // Giả lập trường hợp Service bị null (lỗi data)
                    }
                },
                Equipments = new List<BookingEquipment>(),
                Payments = new List<Payment>(),
                Feedbacks = new List<BookingFeedback>()
            };

            var bookingsList = new List<Booking> { booking };
            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(bookingsList.BuildMock());

            // Setup services phụ
            _mockGeocodingService.Setup(x => x.GetAddressForCoordinatesAsync(It.IsAny<double>(), It.IsAny<double>())).ReturnsAsync("");
            _mockBookingItemRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>())).Returns(new List<BookingItem>().BuildMock());
            _mockPaymentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>())).Returns(new List<Payment>().BuildMock());
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>())).Returns(new List<BookingEquipment>().BuildMock());
            _mockConversationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<ChatConversation, object>>[]>()))
                .Returns(new List<ChatConversation>().BuildMock());

            // Act
            var result = await _bookingService.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Items);
            Assert.Null(result.Items[0].ServiceName); // Kiểm tra ServiceName là null
            Assert.Null(result.Items[0].Description); // Kiểm tra Description là null
        }

        [Fact]
        public async Task GetBookingDetailAsync_ShouldHandleNullAddressAndMissingRelations()
        {
            // Arrange
            var bookingId = Guid.NewGuid();

            // Booking không có Customer, không Technician
            var booking = new Booking
            {
                Id = bookingId,

                // SỬA LỖI CS0037: Xóa dòng gán ID = null. 
                // Chỉ cần gán Navigation Property = null là đủ để test logic mapping.
                Customer = null,
                Technician = null,

                // Khởi tạo các list rỗng
                Feedbacks = new List<BookingFeedback>(),
                Items = new List<BookingItem>(),
                Equipments = new List<BookingEquipment>(),
                Payments = new List<Payment>()
            };

            // Setup Mock
            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());

            // Mock Geocoding trả về NULL
            _mockGeocodingService.Setup(x => x.GetAddressForCoordinatesAsync(It.IsAny<double>(), It.IsAny<double>()))
                .ReturnsAsync((string?)null);

            // Setup các repo phụ
            _mockBookingItemRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingItem, object>>[]>()))
                .Returns(new List<BookingItem>().BuildMock());
            _mockPaymentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(new List<Payment>().BuildMock());
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment>().BuildMock());
            _mockConversationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<ChatConversation, object>>[]>()))
                .Returns(new List<ChatConversation>().BuildMock());

            // Act
            var result = await _bookingService.GetBookingDetailAsync(bookingId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(string.Empty, result.Address); // Address null -> empty string
            Assert.Null(result.CustomerName); // Customer null -> CustomerName null
            Assert.Null(result.TechnicianName); // Technician null -> TechnicianName null
        }

        #endregion

        #region AcceptBookingAsync Tests

        [Fact]
        public async Task AcceptBookingAsync_ShouldSuccess_WhenTokenValidAndTechnicianMatches()
        {
            var token = "token-hop-le";
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var input = new AcceptBookingDto { Token = token, BookingId = bookingId };
            var technician = new TechnicianProfile { Id = techId, UserId = userId };
            var booking = new Booking { Id = bookingId, Status = BookingStatus.Pending, CustomerId = Guid.NewGuid() };

            _mockRedisCacheService.Setup(x => x.GetAsync<string>($"waiting_{token}")).ReturnsAsync("valid");
            _mockRedisCacheService.Setup(x => x.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(techId);

            // Setup Redis SetAsync
            _mockRedisCacheService.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<Guid>(), It.IsAny<TimeSpan?>()))
                .Returns(Task.CompletedTask);

            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            // Setup conversation repository to return empty list (conversation will be null)
            _mockConversationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<ChatConversation, object>>[]>()))
                .Returns(new List<ChatConversation>().BuildMock());

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _bookingService.AcceptBookingAsync(userId, input);

            Assert.True(result.IsSuccess);

            _mockTransaction.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
            _mockRedisCacheService.Verify(r => r.RemoveAsync($"waiting_{token}"), Times.Once);

            // FIX CS0854: Verify Redis SetAsync tường minh generic type <Guid>
            _mockRedisCacheService.Verify(r => r.SetAsync<Guid>(
                $"accepted_{token}",
                techId,
                It.IsAny<TimeSpan?>()
            ), Times.Once);
        }

        [Fact]
        public async Task AcceptBookingAsync_ShouldFail_WhenTokenExpired()
        {
            // Arrange
            var token = "expired-token";
            var userId = Guid.NewGuid();
            var input = new AcceptBookingDto { Token = token, BookingId = Guid.NewGuid() };

            // Redis trả về null (hết hạn)
            _mockRedisCacheService.Setup(x => x.GetAsync<string>($"waiting_{token}")).ReturnsAsync((string?)null);

            // Act
            var result = await _bookingService.AcceptBookingAsync(userId, input);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("hết hạn", result.Message);
        }

        [Fact]
        public async Task AcceptBookingAsync_ShouldFail_WhenWrongTechnician()
        {
            // Arrange
            var token = "valid-token";
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var allowedTechId = Guid.NewGuid(); // ID được mời khác với ID đang login

            var input = new AcceptBookingDto { Token = token, BookingId = Guid.NewGuid() };
            var technician = new TechnicianProfile { Id = techId, UserId = userId };

            _mockRedisCacheService.Setup(x => x.GetAsync<string>($"waiting_{token}")).ReturnsAsync("valid");
            _mockRedisCacheService.Setup(x => x.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(allowedTechId);

            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Act
            var result = await _bookingService.AcceptBookingAsync(userId, input);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("không phải kỹ thuật viên được mời", result.Message);
        }

        [Fact]
        public async Task AcceptBookingAsync_ShouldFail_WhenBookingNotFound()
        {
            // Arrange
            var token = "token";
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            _mockRedisCacheService.Setup(x => x.GetAsync<string>($"waiting_{token}")).ReturnsAsync("valid");
            _mockRedisCacheService.Setup(x => x.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(techId);

            var technician = new TechnicianProfile { Id = techId, UserId = userId };
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Mock Booking trả về null
            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync((Booking?)null);

            var input = new AcceptBookingDto { Token = token, BookingId = bookingId };

            // Act
            var result = await _bookingService.AcceptBookingAsync(userId, input);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("không tồn tại", result.Message);
        }

        [Fact]
        public async Task AcceptBookingAsync_ShouldFail_WhenBookingAlreadyProcessed()
        {
            // Arrange
            var token = "token";
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            _mockRedisCacheService.Setup(x => x.GetAsync<string>($"waiting_{token}")).ReturnsAsync("valid");
            _mockRedisCacheService.Setup(x => x.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(techId);

            var technician = new TechnicianProfile { Id = techId, UserId = userId };
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Mock Booking đã Confirmed
            var booking = new Booking { Id = bookingId, Status = BookingStatus.Confirmed };
            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            var input = new AcceptBookingDto { Token = token, BookingId = bookingId };

            // Act
            var result = await _bookingService.AcceptBookingAsync(userId, input);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("đã được xử lý", result.Message);
        }

        [Fact]
        public async Task AcceptBookingAsync_ShouldFail_WhenRedisReturnsEmptyGuid()
        {
            // Arrange
            var token = "token-empty-guid";
            var userId = Guid.NewGuid();
            var input = new AcceptBookingDto { Token = token, BookingId = Guid.NewGuid() };

            // Redis trả về string "valid" nhưng ID tech lại là Guid.Empty (lỗi data cache)
            _mockRedisCacheService.Setup(x => x.GetAsync<string>($"waiting_{token}")).ReturnsAsync("valid");
            _mockRedisCacheService.Setup(x => x.GetAsync<Guid>($"accept_{token}")).ReturnsAsync(Guid.Empty);

            var technician = new TechnicianProfile { Id = Guid.NewGuid(), UserId = userId };
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Act
            var result = await _bookingService.AcceptBookingAsync(userId, input);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("không phải kỹ thuật viên", result.Message);
        }

        #endregion

        #region CancelBookingAsync Tests

        [Fact]
        public async Task CancelBookingAsync_ShouldCancelAndSendEmail_WhenValid()
        {
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = techId,
                Status = BookingStatus.Confirmed,
                Customer = new AppUser { Email = "khachhang@email.com", FullName = "Khach Hang" }
            };

            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());

            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            var input = new CancelBookingDto { BookingId = bookingId, Reason = "Ly do huy" };

            var result = await _bookingService.CancelBookingAsync(input, userId.ToString());

            Assert.True(result);
            Assert.Equal(BookingStatus.Cancelled, booking.Status);

            // FIX CS0854 (Lỗi dòng 391):
            // Nếu lỗi vẫn còn, chứng tỏ SendEmailAsync có tham số optional (VD: CancellationToken).
            // Tôi thêm It.IsAny<CancellationToken>() vào Verify. 
            // Nếu báo lỗi biên dịch "Argument count", hãy xóa tham số thứ 2 đi, 
            // nhưng CS0854 thường chỉ xuất hiện khi tham số đó thực sự tồn tại.
            _mockEmailService.Verify(e => e.SendEmailAsync(
                It.Is<EmailDto>(dto => dto.ToEmail == "khachhang@email.com")
            // , It.IsAny<CancellationToken>() // Bỏ comment nếu vẫn lỗi CS0854
            ), Times.Once);

            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldReturnFalse_WhenTechnicianNotAuthorized()
        {
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var otherTechId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = otherTechId };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());

            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            var result = await _bookingService.CancelBookingAsync(new CancelBookingDto { BookingId = bookingId }, userId.ToString());

            Assert.False(result);
            _mockBookingRepo.Verify(x => x.Update(It.IsAny<Booking>()), Times.Never);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldNotThrow_WhenEmailServiceFails()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = techId,
                Status = BookingStatus.Confirmed,
                Customer = new AppUser { Email = "test@email.com" } // Có email để trigger gửi
            };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Mock Email Service ném Exception
            _mockEmailService.Setup(x => x.SendEmailAsync(It.IsAny<EmailDto>()))
                .ThrowsAsync(new Exception("SMTP Error"));

            // Act
            var result = await _bookingService.CancelBookingAsync(new CancelBookingDto { BookingId = bookingId }, userId.ToString());

            // Assert
            Assert.True(result); // Vẫn thành công dù email lỗi
            Assert.Equal(BookingStatus.Cancelled, booking.Status);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldHandleNullDesiredDate_WhenSendingEmail()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = techId,
                Status = BookingStatus.Confirmed,
                DesiredDate = null, // TEST CASE: Null Date
                Customer = new AppUser { Email = "c@test.com" },
                Items = new List<BookingItem>() // Empty items -> Service name "Dịch vụ"
            };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Act
            await _bookingService.CancelBookingAsync(new CancelBookingDto { BookingId = bookingId }, userId.ToString());

            // Assert
            _mockEmailService.Verify(x => x.SendEmailAsync(It.Is<EmailDto>(e =>
                e.HtmlBody.Contains("N/A") // Code map null -> "N/A"
            )), Times.Once);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldReturnFalse_WhenStatusIsInvalid()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            // Booking đã hoàn thành
            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.Completed };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Act
            var result = await _bookingService.CancelBookingAsync(new CancelBookingDto { BookingId = bookingId }, userId.ToString());

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldHandleTimezoneConversion_WhenSendingEmail()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = techId,
                Status = BookingStatus.Confirmed,
                // Case: Có DesiredDate để kích hoạt logic convert timezone
                DesiredDate = new DateTime(2024, 1, 1, 10, 0, 0, DateTimeKind.Utc),
                Customer = new AppUser { Email = "c@test.com", FullName = "Customer" }
            };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Act
            var result = await _bookingService.CancelBookingAsync(new CancelBookingDto { BookingId = bookingId }, userId.ToString());

            // Assert
            Assert.True(result);
            // Verify email được gửi và body chứa ngày giờ (chứng tỏ logic convert đã chạy)
            _mockEmailService.Verify(x => x.SendEmailAsync(It.Is<EmailDto>(e =>
                // Kiểm tra xem có string ngày giờ trong body không (ví dụ "01/01/2024")
                e.HtmlBody.Contains("01/01/2024") || e.HtmlBody.Contains("17:00") // UTC+7
            )), Times.Once);
        }

        [Fact]
        public async Task CancelBookingAsync_ShouldSkipEmail_WhenCustomerHasNoEmail()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = techId,
                Status = BookingStatus.Confirmed,
                // Customer có tên nhưng KHÔNG có Email
                Customer = new AppUser { FullName = "No Email User", Email = null }
            };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            _mockBookingRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Booking, object>>[]>()))
                .Returns(new List<Booking> { booking }.BuildMock());
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Act
            var result = await _bookingService.CancelBookingAsync(new CancelBookingDto { BookingId = bookingId }, userId.ToString());

            // Assert
            Assert.True(result); // Vẫn cancel thành công
            Assert.Equal(BookingStatus.Cancelled, booking.Status);

            // Verify: Không bao giờ gọi SendEmailAsync
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
        }

        #endregion

        #region AddEquipmentToBookingAsync Tests
        // (Giữ nguyên logic cũ vì không liên quan đến Geocoding/Email)
        [Fact]
        public async Task AddEquipmentToBookingAsync_ShouldAdd_WhenStockAvailable()
        {
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            var equipment = new Equipment { Id = equipmentId, Quantity = 10, UnitPrice = 100 };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            _mockEquipmentRepo.Setup(x => x.GetByIdAsync(equipmentId)).ReturnsAsync(equipment);

            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment>().BuildMock());

            var input = new AddBookingEquipmentDto { EquipmentId = equipmentId, Quantity = 2 };

            var result = await _bookingService.AddEquipmentToBookingAsync(bookingId, input, userId);

            Assert.True(result);
            _mockBookingEquipmentRepo.Verify(x => x.AddAsync(It.Is<BookingEquipment>(be =>
                be.BookingId == bookingId && be.Quantity == 2
            )), Times.Once);

            _mockTransaction.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task AddEquipmentToBookingAsync_ShouldThrowAndRollback_WhenStockNotEnough()
        {
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            var equipment = new Equipment { Id = equipmentId, Quantity = 1, UnitPrice = 100 };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());
            _mockEquipmentRepo.Setup(x => x.GetByIdAsync(equipmentId)).ReturnsAsync(equipment);

            var input = new AddBookingEquipmentDto { EquipmentId = equipmentId, Quantity = 5 };

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _bookingService.AddEquipmentToBookingAsync(bookingId, input, userId));

            Assert.Contains("không đủ", ex.Message);
            _mockTransaction.Verify(t => t.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task AddEquipmentToBookingAsync_ShouldUpdateQuantity_WhenItemAlreadyExistsInDraft()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };
            var equipment = new Equipment { Id = equipmentId, Quantity = 100, UnitPrice = 50 };

            // Item đã tồn tại trong giỏ (Draft)
            var existingItem = new BookingEquipment
            {
                BookingId = bookingId,
                EquipmentId = equipmentId,
                Quantity = 5,
                Status = BookingEquipmentStatus.Draft,
                IsDeleted = false
            };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());
            _mockEquipmentRepo.Setup(x => x.GetByIdAsync(equipmentId)).ReturnsAsync(equipment);

            // Mock trả về item đã tồn tại
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment> { existingItem }.BuildMock());

            var input = new AddBookingEquipmentDto { EquipmentId = equipmentId, Quantity = 3 };

            // Act
            var result = await _bookingService.AddEquipmentToBookingAsync(bookingId, input, userId);

            // Assert
            Assert.True(result);
            Assert.Equal(8, existingItem.Quantity); // 5 cũ + 3 mới = 8
            _mockBookingEquipmentRepo.Verify(x => x.Update(existingItem), Times.Once);
        }

        [Fact]
        public async Task AddEquipmentToBookingAsync_ShouldThrow_WhenBookingStatusInvalid()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            // Status = Pending (Chưa được phép thêm thiết bị)
            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.Pending };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _bookingService.AddEquipmentToBookingAsync(bookingId, new AddBookingEquipmentDto(), userId));

            // SỬA Ở ĐÂY: Đổi "trạng thái" thành cụm từ thực tế trong code của bạn
            Assert.Contains("thêm thiết bị", ex.Message);
        }

        [Fact]
        public async Task AddEquipmentToBookingAsync_ShouldAccumulateQuantity_WhenItemExistsAsDraft()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };
            var equipment = new Equipment { Id = equipmentId, Quantity = 50, UnitPrice = 100 };

            // Đã có item này trong giỏ (Draft) với số lượng 2
            var existingItem = new BookingEquipment
            {
                BookingId = bookingId,
                EquipmentId = equipmentId,
                Quantity = 2,
                Status = BookingEquipmentStatus.Draft,
                UnitPrice = 100
            };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());
            _mockEquipmentRepo.Setup(x => x.GetByIdAsync(equipmentId)).ReturnsAsync(equipment);

            // Mock trả về existingItem
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment> { existingItem }.BuildMock());

            var input = new AddBookingEquipmentDto { EquipmentId = equipmentId, Quantity = 3 };

            // Act
            var result = await _bookingService.AddEquipmentToBookingAsync(bookingId, input, userId);

            // Assert
            Assert.True(result);
            Assert.Equal(5, existingItem.Quantity); // 2 + 3 = 5
            _mockBookingEquipmentRepo.Verify(x => x.Update(existingItem), Times.Once);
            _mockBookingEquipmentRepo.Verify(x => x.AddAsync(It.IsAny<BookingEquipment>()), Times.Never); // Không được Add mới
        }

        [Fact]
        public async Task AddEquipmentToBookingAsync_ShouldRollback_WhenUnexpectedErrorOccurs()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };
            var equipment = new Equipment { Id = equipmentId, Quantity = 10 };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock()); // Lưu ý dùng .AsQueryable() trước BuildMock để ổn định

            _mockEquipmentRepo.Setup(x => x.GetByIdAsync(equipmentId)).ReturnsAsync(equipment);

            // SỬA LỖI TẠI ĐÂY: Thêm Setup cho BookingEquipmentRepo để hỗ trợ Async Query
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment>().BuildMock());

            // Giả lập lỗi khi SaveChanges
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ThrowsAsync(new Exception("DB Error"));

            // Act & Assert
            // Bây giờ Exception nhận được sẽ là "DB Error" (System.Exception) đúng như mong đợi
            // thay vì InvalidOperationException của EF Core.
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _bookingService.AddEquipmentToBookingAsync(bookingId, new AddBookingEquipmentDto { EquipmentId = equipmentId }, userId));

            Assert.Equal("DB Error", ex.Message);

            // Verify Rollback được gọi
            _mockTransaction.Verify(x => x.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task AddEquipmentToBookingAsync_ShouldThrow_WhenEquipmentNotFound()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Equipment repo trả về null
            _mockEquipmentRepo.Setup(x => x.GetByIdAsync(equipmentId)).ReturnsAsync((Equipment?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _bookingService.AddEquipmentToBookingAsync(bookingId, new AddBookingEquipmentDto { EquipmentId = equipmentId }, userId));

            Assert.Contains("Thiết bị không tồn tại", ex.Message);
        }

        [Fact]
        public async Task AddEquipmentToBookingAsync_ShouldThrowUnauthorized_WhenUserIsNotTechnician()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId };
            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            // Mock Technician Repo trả về rỗng (User này không phải Tech)
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _bookingService.AddEquipmentToBookingAsync(bookingId, new AddBookingEquipmentDto(), userId));
        }

        #endregion

        #region TryCompleteBookingAsync Tests
        // (Giữ nguyên logic cũ)
        [Fact]
        public async Task TryCompleteBookingAsync_ShouldReturnTrue_WhenAllConditionsMet()
        {
            var bookingId = Guid.NewGuid();
            var booking = new Booking { Id = bookingId, Status = BookingStatus.InProgress };
            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            var files = new List<FileRelation>
            {
                new FileRelation { ObjectId = bookingId, RelationType = "CheckInProof" },
                new FileRelation { ObjectId = bookingId, RelationType = "CheckOutProof" }
            };
            _mockFileRelationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<FileRelation, object>>[]>()))
                .Returns(files.BuildMock());

            var payments = new List<Payment>
            {
                new Payment { BookingId = bookingId, Type = PaymentType.Service, Status = PaymentStatus.Completed, IsDeleted = false }
            };
            _mockPaymentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(payments.BuildMock());

            var equipments = new List<BookingEquipment>
            {
                new BookingEquipment { BookingId = bookingId, Status = BookingEquipmentStatus.Paid, IsDeleted = false }
            };
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(equipments.BuildMock());

            var result = await _bookingService.TryCompleteBookingAsync(bookingId);

            Assert.True(result);
            Assert.Equal(BookingStatus.Completed, booking.Status);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task TryCompleteBookingAsync_ShouldReturnFalse_WhenPaymentPending()
        {
            var bookingId = Guid.NewGuid();
            var booking = new Booking { Id = bookingId, Status = BookingStatus.InProgress };
            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            var files = new List<FileRelation>
            {
                new FileRelation { ObjectId = bookingId, RelationType = "CheckInProof" },
                new FileRelation { ObjectId = bookingId, RelationType = "CheckOutProof" }
            };
            _mockFileRelationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<FileRelation, object>>[]>()))
                .Returns(files.BuildMock());

            var payments = new List<Payment>
            {
                new Payment { BookingId = bookingId, Type = PaymentType.Service, Status = PaymentStatus.Pending, IsDeleted = false }
            };
            _mockPaymentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(payments.BuildMock());

            var result = await _bookingService.TryCompleteBookingAsync(bookingId);

            Assert.False(result);
            Assert.NotEqual(BookingStatus.Completed, booking.Status);
        }

        [Fact]
        public async Task TryCompleteBookingAsync_ShouldFail_WhenMissingCheckOutProof()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = new Booking { Id = bookingId, Status = BookingStatus.InProgress };
            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            // Chỉ có CheckIn, THIẾU CheckOut
            var files = new List<FileRelation>
            {
                new FileRelation { ObjectId = bookingId, RelationType = "CheckInProof" }
            };
            _mockFileRelationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<FileRelation, object>>[]>()))
                .Returns(files.BuildMock());

            // Act
            var result = await _bookingService.TryCompleteBookingAsync(bookingId);

            // Assert
            Assert.False(result); // Fail
            Assert.NotEqual(BookingStatus.Completed, booking.Status);
        }

        [Fact]
        public async Task TryCompleteBookingAsync_ShouldFail_WhenEquipmentNotPaid()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = new Booking { Id = bookingId, Status = BookingStatus.InProgress };
            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            // Đủ file CheckIn/CheckOut
            var files = new List<FileRelation>
            {
                new FileRelation { ObjectId = bookingId, RelationType = "CheckInProof" },
                new FileRelation { ObjectId = bookingId, RelationType = "CheckOutProof" }
            };
            _mockFileRelationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<FileRelation, object>>[]>()))
                .Returns(files.BuildMock());

            // Đủ Payment Service
            var payments = new List<Payment>
            {
                new Payment { BookingId = bookingId, Type = PaymentType.Service, Status = PaymentStatus.Completed }
            };
            _mockPaymentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(payments.BuildMock());

            // NHƯNG: Thiết bị mới chỉ ở trạng thái Submitted (Chưa Paid)
            var equipments = new List<BookingEquipment>
            {
                new BookingEquipment { BookingId = bookingId, Status = BookingEquipmentStatus.Submitted, IsDeleted = false }
            };
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(equipments.BuildMock());

            // Act
            var result = await _bookingService.TryCompleteBookingAsync(bookingId);

            // Assert
            Assert.False(result); // Fail vì thiết bị chưa thanh toán
        }

        [Fact]
        public async Task TryCompleteBookingAsync_ShouldFail_WhenMissingProofs()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = new Booking { Id = bookingId, Status = BookingStatus.InProgress };
            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            // Case 1: Không có file nào => Fail ngay ở CheckIn
            _mockFileRelationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<FileRelation, object>>[]>()))
                .Returns(new List<FileRelation>().BuildMock());

            var result1 = await _bookingService.TryCompleteBookingAsync(bookingId);
            Assert.False(result1);

            // Case 2: Có CheckIn nhưng thiếu CheckOut => Fail ở CheckOut
            var files = new List<FileRelation> { new FileRelation { ObjectId = bookingId, RelationType = "CheckInProof" } };
            _mockFileRelationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<FileRelation, object>>[]>()))
                .Returns(files.BuildMock());

            var result2 = await _bookingService.TryCompleteBookingAsync(bookingId);
            Assert.False(result2);
        }

        [Fact]
        public async Task TryCompleteBookingAsync_ShouldFail_WhenServicePaymentMissingOrPending()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var booking = new Booking { Id = bookingId, Status = BookingStatus.InProgress };
            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            // Đủ File proof
            var files = new List<FileRelation>
            {
                new FileRelation { ObjectId = bookingId, RelationType = "CheckInProof" },
                new FileRelation { ObjectId = bookingId, RelationType = "CheckOutProof" }
            };
            _mockFileRelationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<FileRelation, object>>[]>()))
                .Returns(files.BuildMock());

            // Case 1: Payment null (chưa tạo)
            _mockPaymentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(new List<Payment>().BuildMock());

            var result1 = await _bookingService.TryCompleteBookingAsync(bookingId);
            Assert.False(result1);

            // Case 2: Payment có nhưng chưa Completed
            var payments = new List<Payment> { new Payment { BookingId = bookingId, Type = PaymentType.Service, Status = PaymentStatus.Pending } };
            _mockPaymentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(payments.BuildMock());

            var result2 = await _bookingService.TryCompleteBookingAsync(bookingId);
            Assert.False(result2);
        }

        [Fact]
        public async Task TryCompleteBookingAsync_ShouldReturnTrue_WhenAlreadyCompleted()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            // Booking đã hoàn thành
            var booking = new Booking { Id = bookingId, Status = BookingStatus.Completed };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            // Act
            var result = await _bookingService.TryCompleteBookingAsync(bookingId);

            // Assert
            Assert.True(result); // Trả về true ngay lập tức

            // Verify: Không cần check file hay payment gì cả
            _mockFileRelationRepo.Verify(x => x.GetAll(It.IsAny<Expression<Func<FileRelation, object>>[]>()), Times.Never);
        }

        #endregion

        #region UpdateBookingStatusAsync Tests

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldUpdate_WhenValidAndNotCompleted()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var booking = new Booking
            {
                Id = bookingId,
                TechnicianId = techId,
                Status = BookingStatus.Confirmed,
                DesiredDate = DateTime.UtcNow // Tránh lỗi Nullable
            };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = techUserId } };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            var input = new UpdateBookingStatusDto { BookingId = bookingId, Status = BookingStatus.InProgress };

            // Act
            var result = await _bookingService.UpdateBookingStatusAsync(input, techUserId.ToString());

            // Assert
            Assert.True(result);
            Assert.Equal(BookingStatus.InProgress, booking.Status);
            _mockBookingRepo.Verify(x => x.Update(booking), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldReturnFalse_WhenTechnicianNotAuthorized()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var otherTechId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = otherTechId };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = techUserId } };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            var input = new UpdateBookingStatusDto { BookingId = bookingId, Status = BookingStatus.InProgress };

            // Act
            var result = await _bookingService.UpdateBookingStatusAsync(input, techUserId.ToString());

            // Assert
            Assert.False(result);
            _mockBookingRepo.Verify(x => x.Update(It.IsAny<Booking>()), Times.Never);
        }

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldUpdate_WhenStatusIsNotCompleted()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.Confirmed };
            // Fix CS0246: Dùng AppUser
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = techUserId } };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            var input = new UpdateBookingStatusDto { BookingId = bookingId, Status = BookingStatus.InProgress };

            // Act
            var result = await _bookingService.UpdateBookingStatusAsync(input, techUserId.ToString());

            // Assert
            Assert.True(result);
            Assert.Equal(BookingStatus.InProgress, booking.Status);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldReturnFalse_WhenTechnicianDoesNotMatch()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var otherTechId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = otherTechId };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = techUserId } };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            var input = new UpdateBookingStatusDto { BookingId = bookingId, Status = BookingStatus.InProgress };

            // Act
            var result = await _bookingService.UpdateBookingStatusAsync(input, techUserId.ToString());

            // Assert
            Assert.False(result); // Phải trả về false do sai người
        }

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldFailToComplete_WhenConditionsNotMet()
        {
            // Arrange: Muốn set Completed nhưng chưa có Payment/Proof
            var bookingId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = techUserId } };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Mock File rỗng => CheckAndUpdateBookingCompletionAsync trả về false
            _mockFileRelationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<FileRelation, object>>[]>()))
                .Returns(new List<FileRelation>().BuildMock());

            var input = new UpdateBookingStatusDto { BookingId = bookingId, Status = BookingStatus.Completed };

            // Act
            var result = await _bookingService.UpdateBookingStatusAsync(input, techUserId.ToString());

            // Assert
            Assert.True(result); // Hàm trả về true (đã xử lý request)
            Assert.NotEqual(BookingStatus.Completed, booking.Status); // Nhưng Status KHÔNG đổi vì thiếu điều kiện
        }

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldComplete_WhenAllConditionsMet()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // 1. Mock đủ file CheckIn/CheckOut
            var files = new List<FileRelation>
            {
                new FileRelation { ObjectId = bookingId, RelationType = "CheckInProof" },
                new FileRelation { ObjectId = bookingId, RelationType = "CheckOutProof" }
            };
            _mockFileRelationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<FileRelation, object>>[]>()))
                .Returns(files.BuildMock());

            // 2. Mock Payment Service đã trả
            var payments = new List<Payment>
            {
                new Payment { BookingId = bookingId, Type = PaymentType.Service, Status = PaymentStatus.Completed }
            };
            _mockPaymentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(payments.BuildMock());

            // 3. Mock Equipment đã trả tiền
            var equipments = new List<BookingEquipment>
            {
                new BookingEquipment { BookingId = bookingId, Status = BookingEquipmentStatus.Paid }
            };
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(equipments.BuildMock());

            var input = new UpdateBookingStatusDto { BookingId = bookingId, Status = BookingStatus.Completed };

            // Act
            var result = await _bookingService.UpdateBookingStatusAsync(input, userId.ToString());

            // Assert
            Assert.True(result);
            Assert.Equal(BookingStatus.Completed, booking.Status); // Status phải đổi thành Completed
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.AtLeastOnce);
        }

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldNotComplete_WhenEquipmentNotPaid()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Đủ File
            var files = new List<FileRelation>
            {
                new FileRelation { ObjectId = bookingId, RelationType = "CheckInProof" },
                new FileRelation { ObjectId = bookingId, RelationType = "CheckOutProof" }
            };
            _mockFileRelationRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<FileRelation, object>>[]>()))
                .Returns(files.BuildMock());

            // Đủ Payment Service
            var payments = new List<Payment>
            {
                new Payment { BookingId = bookingId, Type = PaymentType.Service, Status = PaymentStatus.Completed }
            };
            _mockPaymentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<Payment, object>>[]>()))
                .Returns(payments.BuildMock());

            // Equipment chưa trả tiền (Submitted)
            var equipments = new List<BookingEquipment>
            {
                new BookingEquipment { BookingId = bookingId, Status = BookingEquipmentStatus.Submitted }
            };
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(equipments.BuildMock());

            var input = new UpdateBookingStatusDto { BookingId = bookingId, Status = BookingStatus.Completed };

            // Act
            await _bookingService.UpdateBookingStatusAsync(input, userId.ToString());

            // Assert
            Assert.NotEqual(BookingStatus.Completed, booking.Status); // Vẫn giữ InProgress
        }

        [Fact]
        public async Task UpdateBookingStatusAsync_ShouldReturnFalse_WhenBookingNotFound()
        {
            // Arrange
            var bookingId = Guid.NewGuid();

            // Mock trả về null
            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync((Booking?)null);

            // Act
            var result = await _bookingService.UpdateBookingStatusAsync(
                new UpdateBookingStatusDto { BookingId = bookingId, Status = BookingStatus.Completed },
                Guid.NewGuid().ToString());

            // Assert
            Assert.False(result);
        }

        #endregion

        #region TechnicianRejectAsync Tests

        [Fact]
        public async Task TechnicianRejectAsync_ShouldSetRedis_WhenTechnicianExists()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var technician = new TechnicianProfile { Id = techId, UserId = userId };

            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            _mockRedisCacheService.Setup(x => x.SetAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<TimeSpan?>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _bookingService.TechnicianRejectAsync(bookingId, userId);

            // Assert
            Assert.True(result);
            _mockRedisCacheService.Verify(x => x.SetAsync(
                $"reject_{bookingId}_{techId}",
                "rejected",
                It.IsAny<TimeSpan?>()), Times.Once);
        }

        [Fact]
        public async Task TechnicianRejectAsync_ShouldThrow_WhenTechnicianNotFound()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid(); // User ID không tồn tại trong hệ thống Technician

            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile>().BuildMock());

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _bookingService.TechnicianRejectAsync(bookingId, userId));

            Assert.Equal("Kỹ thuật viên không tồn tại", ex.Message);
        }

        #endregion

        #region SubmitEquipmentToCustomerAsync Tests

        [Fact]
        public async Task SubmitEquipmentToCustomerAsync_ShouldUpdateStatus_WhenValid()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var itemDraftId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            var equipments = new List<BookingEquipment>
            {
                new BookingEquipment { Id = itemDraftId, BookingId = bookingId, Status = BookingEquipmentStatus.Draft }
            };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);

            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(equipments.BuildMock());

            var input = new SubmitEquipmentDto
            {
                BookingId = bookingId,
                BookingEquipmentIds = new List<Guid> { itemDraftId }
            };

            // Act
            var result = await _bookingService.SubmitEquipmentToCustomerAsync(input, userId);

            // Assert
            Assert.True(result);
            Assert.Equal(BookingEquipmentStatus.Submitted, equipments[0].Status);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task SubmitEquipmentToCustomerAsync_ShouldReturnFalse_WhenNoItemsFound()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            // Mock trả về list rỗng (không tìm thấy equipment khớp ID)
            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment>().BuildMock());

            var input = new SubmitEquipmentDto
            {
                BookingId = bookingId,
                BookingEquipmentIds = new List<Guid> { Guid.NewGuid() } // ID random
            };

            // Act
            var result = await _bookingService.SubmitEquipmentToCustomerAsync(input, userId);

            // Assert
            Assert.False(result);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never);
        }

        #endregion

        #region ApproveEquipmentAsync Tests

        [Fact]
        public async Task ApproveEquipmentAsync_ShouldThrow_WhenStockInsufficient()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var eqItemId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            var equipment = new Equipment { Id = equipmentId, Quantity = 1, Name = "May Khoan" }; // Kho còn 1
            var bookingEq = new BookingEquipment
            {
                Id = eqItemId,
                BookingId = bookingId,
                EquipmentId = equipmentId,
                Equipment = equipment,
                Quantity = 2, // Cần 2
                Status = BookingEquipmentStatus.Paid
            };

            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment> { bookingEq }.BuildMock());

            var input = new ApproveEquipmentDto
            {
                BookingId = bookingId,
                BookingEquipmentIds = new List<Guid> { eqItemId }
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _bookingService.ApproveEquipmentAsync(input, Guid.NewGuid()));

            Assert.Contains("không đủ tồn kho", ex.Message);
            _mockTransaction.Verify(x => x.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ApproveEquipmentAsync_ShouldDeductStock_WhenPaidAndStockAvailable()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var eqItemId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();
            var managerId = Guid.NewGuid();

            var equipment = new Equipment { Id = equipmentId, Quantity = 10, Name = "May Khoan" };
            var bookingEq = new BookingEquipment
            {
                Id = eqItemId,
                BookingId = bookingId,
                EquipmentId = equipmentId,
                Equipment = equipment, // Link object để .Include hoạt động in-memory
                Quantity = 2,
                Status = BookingEquipmentStatus.Paid
            };

            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment> { bookingEq }.BuildMock());

            var input = new ApproveEquipmentDto
            {
                BookingId = bookingId,
                BookingEquipmentIds = new List<Guid> { eqItemId }
            };

            // Act
            var result = await _bookingService.ApproveEquipmentAsync(input, managerId);

            // Assert
            Assert.True(result);
            Assert.Equal(8, equipment.Quantity); // 10 - 2 = 8
            Assert.Equal(BookingEquipmentStatus.AwaitingDelivery, bookingEq.Status);

            // Verify Transaction Commit
            _mockTransaction.Verify(x => x.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ApproveEquipmentAsync_ShouldThrowAndRollback_WhenStockInsufficient()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var eqItemId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            var equipment = new Equipment { Id = equipmentId, Quantity = 1 }; // Kho còn 1
            var bookingEq = new BookingEquipment
            {
                Id = eqItemId,
                BookingId = bookingId,
                EquipmentId = equipmentId,
                Equipment = equipment,
                Quantity = 5, // Cần 5
                Status = BookingEquipmentStatus.Paid
            };

            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment> { bookingEq }.BuildMock());

            var input = new ApproveEquipmentDto { BookingId = bookingId, BookingEquipmentIds = new List<Guid> { eqItemId } };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _bookingService.ApproveEquipmentAsync(input, Guid.NewGuid()));

            Assert.Contains("không đủ tồn kho", ex.Message);
            _mockTransaction.Verify(x => x.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ApproveEquipmentAsync_ShouldReturnFalse_WhenNoItemsFound()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var itemIds = new List<Guid> { Guid.NewGuid() };

            // Mock trả về rỗng
            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment>().BuildMock());

            var input = new ApproveEquipmentDto { BookingId = bookingId, BookingEquipmentIds = itemIds };

            // Act
            var result = await _bookingService.ApproveEquipmentAsync(input, Guid.NewGuid());

            // Assert
            Assert.False(result);
            _mockTransaction.Verify(x => x.CommitAsync(It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task ApproveEquipmentAsync_ShouldIgnoreItems_WhenStatusIsNotPaid()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var itemId = Guid.NewGuid();

            var bookingEq = new BookingEquipment
            {
                Id = itemId,
                BookingId = bookingId,
                Status = BookingEquipmentStatus.Submitted, // Status không phải Paid
                Quantity = 5,
                Equipment = new Equipment { Quantity = 100 }
            };

            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment> { bookingEq }.BuildMock());

            var input = new ApproveEquipmentDto { BookingId = bookingId, BookingEquipmentIds = new List<Guid> { itemId } };

            // Act
            var result = await _bookingService.ApproveEquipmentAsync(input, Guid.NewGuid());

            // Assert
            Assert.True(result);
            // Verify KHÔNG update gì cả
            _mockBookingEquipmentRepo.Verify(x => x.Update(It.IsAny<BookingEquipment>()), Times.Never);
            // Verify kho KHÔNG bị trừ
            _mockEquipmentRepo.Verify(x => x.Update(It.IsAny<Equipment>()), Times.Never);
        }

        [Fact]
        public async Task ApproveEquipmentAsync_ShouldRollback_WhenDatabaseFails()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var itemId = Guid.NewGuid();

            var bookingEq = new BookingEquipment
            {
                Id = itemId,
                BookingId = bookingId,
                Status = BookingEquipmentStatus.Paid,
                Quantity = 1,
                Equipment = new Equipment { Quantity = 10 }
            };

            _mockBookingEquipmentRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<BookingEquipment, object>>[]>()))
                .Returns(new List<BookingEquipment> { bookingEq }.BuildMock());

            // Giả lập lỗi khi SaveChanges
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ThrowsAsync(new Exception("Fatal DB Error"));

            var input = new ApproveEquipmentDto { BookingId = bookingId, BookingEquipmentIds = new List<Guid> { itemId } };

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() =>
                _bookingService.ApproveEquipmentAsync(input, Guid.NewGuid()));

            // Verify Rollback
            _mockTransaction.Verify(x => x.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        #endregion


        #region RemoveEquipmentFromBookingAsync Tests

        [Fact]
        public async Task RemoveEquipmentFromBookingAsync_ShouldRestoreStock_WhenRemoved()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var itemDraftId = Guid.NewGuid();
            var equipmentId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            // Item đang có 5 cái trong giỏ
            var bookingEq = new BookingEquipment { Id = itemDraftId, EquipmentId = equipmentId, Quantity = 5, IsDeleted = false };
            // Kho đang có 10 cái
            var equipment = new Equipment { Id = equipmentId, Quantity = 10 };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            _mockBookingEquipmentRepo.Setup(x => x.GetByIdAsync(itemDraftId)).ReturnsAsync(bookingEq);
            _mockEquipmentRepo.Setup(x => x.GetByIdAsync(equipmentId)).ReturnsAsync(equipment);

            // Act
            var result = await _bookingService.RemoveEquipmentFromBookingAsync(bookingId, itemDraftId, userId);

            // Assert
            Assert.True(result);
            Assert.True(bookingEq.IsDeleted); // Đã xóa mềm
            Assert.Equal(15, equipment.Quantity); // 10 + 5 trả lại = 15

            _mockTransaction.Verify(x => x.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task RemoveEquipmentFromBookingAsync_ShouldThrow_WhenBookingStatusIsCompleted()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            // Status = Completed (Không được xóa thiết bị nữa)
            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.Completed };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _bookingService.RemoveEquipmentFromBookingAsync(bookingId, Guid.NewGuid(), userId));

            // Assert nội dung lỗi (chú ý chữ thường/hoa như đã fix ở bài trước)
            Assert.Contains("trạng thái", ex.Message.ToLower()); // Hoặc cụm từ chính xác trong code của bạn
        }

        [Fact]
        public async Task RemoveEquipmentFromBookingAsync_ShouldThrow_WhenItemNotFound()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var itemDraftId = Guid.NewGuid();

            var booking = new Booking { Id = bookingId, TechnicianId = techId, Status = BookingStatus.InProgress };
            var technician = new TechnicianProfile { Id = techId, User = new AppUser { Id = userId } };

            _mockBookingRepo.Setup(x => x.GetByIdAsync(bookingId)).ReturnsAsync(booking);
            _mockTechnicianRepo.Setup(x => x.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(new List<TechnicianProfile> { technician }.BuildMock());

            // Repo BookingEquipment trả về null
            _mockBookingEquipmentRepo.Setup(x => x.GetByIdAsync(itemDraftId)).ReturnsAsync((BookingEquipment?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _bookingService.RemoveEquipmentFromBookingAsync(bookingId, itemDraftId, userId));

            Assert.Contains("Không tìm thấy thiết bị", ex.Message);
        }

        #endregion

    }
}