using HSP.Core.Dtos.EquipmentRequest;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Service.Implementations.Internal;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Localization;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using System.Linq.Expressions;
using Xunit;

namespace HSP.Service.Test.Implementations.Internal
{
    public class EquipmentRequestServiceTests
    {
        // Mocks dependencies
        private readonly Mock<IRepository<BookingEquipment, Guid>> _mockBookingEquipmentRepo;
        private readonly Mock<IRepository<Booking, Guid>> _mockBookingRepo;
        private readonly Mock<IRepository<Equipment, Guid>> _mockEquipmentRepo;
        private readonly Mock<IRepository<Payment, Guid>> _mockPaymentRepo;
        private readonly Mock<IRepository<TechnicianProfile, Guid>> _mockTechnicianRepo;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IStringLocalizer<EquipmentRequestService>> _mockLocalizer;

        // System Under Test
        private readonly EquipmentRequestService _service;

        public EquipmentRequestServiceTests()
        {
            _mockBookingEquipmentRepo = new Mock<IRepository<BookingEquipment, Guid>>();
            _mockBookingRepo = new Mock<IRepository<Booking, Guid>>();
            _mockEquipmentRepo = new Mock<IRepository<Equipment, Guid>>();
            _mockPaymentRepo = new Mock<IRepository<Payment, Guid>>();
            _mockTechnicianRepo = new Mock<IRepository<TechnicianProfile, Guid>>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLocalizer = new Mock<IStringLocalizer<EquipmentRequestService>>();

            // Setup Transaction Mock (Luôn trả về success transaction giả)
            _mockUnitOfWork.Setup(u => u.BeginTransactionAsync())
                .ReturnsAsync(new Mock<IDbContextTransaction>().Object);

            _service = new EquipmentRequestService(
                _mockBookingEquipmentRepo.Object,
                _mockBookingRepo.Object,
                _mockEquipmentRepo.Object,
                _mockPaymentRepo.Object,
                _mockTechnicianRepo.Object,
                _mockUnitOfWork.Object,
                _mockLocalizer.Object
            );
        }

        #region Helper Methods to Create Dummy Data

        private List<BookingEquipment> GetFakeBookingEquipments()
        {
            // SỬA: Dùng AppUser thay vì CustomerProfile
            var customer = new AppUser
            {
                Id = Guid.NewGuid(),
                FullName = "Nguyen Van A",
                PhoneNumber = "0900000001"
            };

            // SỬA: Technician.User cũng thường là AppUser
            var techUser = new AppUser
            {
                Id = Guid.NewGuid(),
                FullName = "Tech Guy",
                PhoneNumber = "0900000002"
            };

            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                User = techUser
            };

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                DateCreated = DateTime.Now.AddDays(-2),
                DateModified = DateTime.Now,
                Customer = customer,       // Gán AppUser vào đây
                CustomerId = customer.Id,
                Technician = technician,
                TechnicianId = technician.Id,
                DesiredDate = DateTime.Now.AddDays(1),
                Status = BookingStatus.Confirmed, // Đảm bảo bạn có Enum này hoặc đổi sang trạng thái phù hợp
                Latitude = 10.5,
                Longitude = 106.5
            };

            var equipment = new Equipment { Id = Guid.NewGuid(), Name = "Khoan Be Tong", Quantity = 10 };

            // Giả lập Payment
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                Amount = 500000,
                // PaymentMethod và Status lấy từ Enum của bạn
                // Nếu code báo lỗi Enum, hãy thay bằng giá trị hợp lệ, ví dụ (PaymentMethod)1
            };

            return new List<BookingEquipment>
    {
        // Item 1: Paid (Ready to Approve)
        new BookingEquipment
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Booking = booking,
            EquipmentId = equipment.Id,
            Equipment = equipment,
            Status = BookingEquipmentStatus.Paid,
            Quantity = 2,
            UnitPrice = 100000,
            PaymentId = payment.Id,
            Payment = payment,
            IsDeleted = false
        },
        // Item 2: AwaitingDelivery (Ready to Confirm Receipt)
        new BookingEquipment
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Booking = booking,
            EquipmentId = equipment.Id,
            Equipment = equipment,
            Status = BookingEquipmentStatus.AwaitingDelivery,
            Quantity = 1,
            UnitPrice = 100000,
            PaymentId = payment.Id,
            Payment = payment,
            IsDeleted = false
        },
        // Item 3: Draft
        new BookingEquipment
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Booking = booking,
            EquipmentId = equipment.Id,
            Equipment = equipment,
            Status = BookingEquipmentStatus.Draft,
            Quantity = 1,
            UnitPrice = 50000,
            IsDeleted = false
        }
    };
        }

        #endregion

        #region 1. GetAllEquipmentRequestsAsync

        [Fact]
        public async Task GetAll_ShouldReturnDefaultStatus_WhenFilterStatusIsNull()
        {
            // Arrange
            var data = GetFakeBookingEquipments(); // Contains Paid, Awaiting, Draft
            var mockDbSet = data.BuildMock();
            _mockBookingEquipmentRepo.Setup(r => r.GetAll()).Returns(mockDbSet);

            var filter = new EquipmentRequestFilterDto { Status = null };

            // Act
            var result = await _service.GetAllEquipmentRequestsAsync(filter);

            // Assert
            // Default logic: Paid || AwaitingDelivery || Delivered.
            // Draft (Item 3) should be excluded.
            Assert.Equal(2, result.TotalCount);
            Assert.DoesNotContain(result.Items, i => i.Status == BookingEquipmentStatus.Draft);
        }

        [Fact]
        public async Task GetAll_ShouldFilterByStatus_WhenStatusIsProvided()
        {
            // Arrange
            var data = GetFakeBookingEquipments();
            var mockDbSet = data.BuildMock();
            _mockBookingEquipmentRepo.Setup(r => r.GetAll()).Returns(mockDbSet);

            var filter = new EquipmentRequestFilterDto { Status = BookingEquipmentStatus.Paid };

            // Act
            var result = await _service.GetAllEquipmentRequestsAsync(filter);

            // Assert
            Assert.Single(result.Items);
            Assert.Equal(BookingEquipmentStatus.Paid, result.Items.First().Status);
        }

        [Fact]
        public async Task GetAll_ShouldFilterByTechnicianId()
        {
            // Arrange
            var data = GetFakeBookingEquipments();
            var targetTechUserId = data.First().Booking.Technician.User.Id;
            var mockDbSet = data.BuildMock();
            _mockBookingEquipmentRepo.Setup(r => r.GetAll()).Returns(mockDbSet);

            var filter = new EquipmentRequestFilterDto { TechnicianId = targetTechUserId, Status = null };

            // Act
            var result = await _service.GetAllEquipmentRequestsAsync(filter);

            // Assert
            Assert.Equal(2, result.TotalCount); // Paid and Awaiting for this tech
        }

        #endregion

        #region 2. GetEquipmentRequestDetailAsync

        [Fact]
        public async Task GetDetail_ShouldReturnDto_WhenIdExists()
        {
            // Arrange
            var data = GetFakeBookingEquipments();
            var targetItem = data.First(); // Item 1
            var mockDbSet = data.BuildMock();
            _mockBookingEquipmentRepo.Setup(r => r.GetAll()).Returns(mockDbSet);

            // Act
            var result = await _service.GetEquipmentRequestDetailAsync(targetItem.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(targetItem.Id, result.Id);
            Assert.Equal(targetItem.Equipment.Name, result.EquipmentName);
            Assert.NotNull(result.BookingDetail);
            Assert.NotNull(result.PaymentDetail);
            Assert.Equal(targetItem.Payment.Amount, result.PaymentDetail.Amount);
        }

        [Fact]
        public async Task GetDetail_ShouldReturnNull_WhenIdDoesNotExist()
        {
            // Arrange
            var data = GetFakeBookingEquipments();
            var mockDbSet = data.BuildMock();
            _mockBookingEquipmentRepo.Setup(r => r.GetAll()).Returns(mockDbSet);

            // Act
            var result = await _service.GetEquipmentRequestDetailAsync(Guid.NewGuid());

            // Assert
            Assert.Null(result);
        }

        #endregion

        #region 3. ApproveEquipmentRequestAsync

        [Fact]
        public async Task Approve_ShouldSuccess_WhenStockIsSufficient()
        {
            // Arrange
            var data = GetFakeBookingEquipments();
            var itemToApprove = data.First(x => x.Status == BookingEquipmentStatus.Paid); // Qty=2
            var initialStock = itemToApprove.Equipment.Quantity; // Stock=10

            var mockDbSet = data.BuildMock();
            _mockBookingEquipmentRepo.Setup(r => r.GetAll()).Returns(mockDbSet);

            var input = new ApproveEquipmentRequestDto
            {
                BookingId = itemToApprove.BookingId,
                BookingEquipmentIds = new List<Guid> { itemToApprove.Id }
            };

            // Act
            var result = await _service.ApproveEquipmentRequestAsync(input, Guid.NewGuid());

            // Assert
            Assert.True(result);
            Assert.Equal(BookingEquipmentStatus.AwaitingDelivery, itemToApprove.Status);
            Assert.Equal(initialStock - itemToApprove.Quantity, itemToApprove.Equipment.Quantity); // 10 - 2 = 8

            // Verify DB interactions
            _mockEquipmentRepo.Verify(r => r.Update(It.IsAny<Equipment>()), Times.Once);
            _mockBookingEquipmentRepo.Verify(r => r.Update(It.IsAny<BookingEquipment>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task Approve_ShouldThrowException_WhenStockIsInsufficient()
        {
            // Arrange
            var data = GetFakeBookingEquipments();
            var itemToApprove = data.First(x => x.Status == BookingEquipmentStatus.Paid);

            // Hack: Make stock lower than request quantity
            itemToApprove.Quantity = 50;
            itemToApprove.Equipment.Quantity = 10;

            var mockDbSet = data.BuildMock();
            _mockBookingEquipmentRepo.Setup(r => r.GetAll()).Returns(mockDbSet);

            var input = new ApproveEquipmentRequestDto
            {
                BookingId = itemToApprove.BookingId,
                BookingEquipmentIds = new List<Guid> { itemToApprove.Id }
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.ApproveEquipmentRequestAsync(input, Guid.NewGuid()));

            Assert.Contains("không đủ tồn kho", exception.Message);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never); // Should not save
        }

        [Fact]
        public async Task Approve_ShouldReturnFalse_WhenNoMatchingItemsFound()
        {
            // Arrange
            var data = GetFakeBookingEquipments();
            var mockDbSet = data.BuildMock();
            _mockBookingEquipmentRepo.Setup(r => r.GetAll()).Returns(mockDbSet);

            var input = new ApproveEquipmentRequestDto
            {
                BookingId = Guid.NewGuid(), // Random BookingId
                BookingEquipmentIds = new List<Guid> { Guid.NewGuid() }
            };

            // Act
            var result = await _service.ApproveEquipmentRequestAsync(input, Guid.NewGuid());

            // Assert
            Assert.False(result);
        }

        #endregion

        #region 4. ConfirmReceiptAsync

        [Fact]
        public async Task Confirm_ShouldSuccess_WhenTechnicianIsCorrectAndItemIsAwaiting()
        {
            // Arrange
            var data = GetFakeBookingEquipments();
            var itemToConfirm = data.First(x => x.Status == BookingEquipmentStatus.AwaitingDelivery);
            var booking = itemToConfirm.Booking;
            var techUserMsId = booking.Technician.User.Id;

            // 1. Mock Technician
            var techList = new List<TechnicianProfile> { booking.Technician };
            _mockTechnicianRepo.Setup(r => r.GetAll()).Returns(techList.BuildMock());

            // 2. Mock Booking (GetById)
            _mockBookingRepo.Setup(r => r.GetByIdAsync(booking.Id)).ReturnsAsync(booking);

            // 3. Mock BookingEquipment Query
            var mockDbSet = data.BuildMock();
            _mockBookingEquipmentRepo.Setup(r => r.GetAll()).Returns(mockDbSet);

            var input = new ConfirmReceiptDto
            {
                BookingId = booking.Id,
                BookingEquipmentIds = new List<Guid> { itemToConfirm.Id }
            };

            // Act
            var result = await _service.ConfirmReceiptAsync(input, techUserMsId);

            // Assert
            Assert.True(result);
            Assert.Equal(BookingEquipmentStatus.Delivered, itemToConfirm.Status);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task Confirm_ShouldThrowUnauthorized_WhenTechnicianDoesNotMatchBooking()
        {
            // Arrange
            var data = GetFakeBookingEquipments();
            var booking = data.First().Booking;

            // SỬA Ở ĐÂY: Thay "new User" bằng "new AppUser"
            var otherTech = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                User = new AppUser { Id = Guid.NewGuid() } // <--- Đã sửa
            };

            _mockTechnicianRepo.Setup(r => r.GetAll()).Returns(new List<TechnicianProfile> { otherTech }.BuildMock());
            _mockBookingRepo.Setup(r => r.GetByIdAsync(booking.Id)).ReturnsAsync(booking);

            var input = new ConfirmReceiptDto { BookingId = booking.Id };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _service.ConfirmReceiptAsync(input, otherTech.User.Id));

            Assert.Contains("không có quyền xác nhận", ex.Message);
        }

        [Fact]
        public async Task Confirm_ShouldThrowKeyNotFound_WhenBookingDoesNotExist()
        {
            // Arrange
            // SỬA Ở ĐÂY: Thay "new User" bằng "new AppUser"
            var tech = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                User = new AppUser { Id = Guid.NewGuid() } // <--- Đã sửa
            };

            _mockTechnicianRepo.Setup(r => r.GetAll()).Returns(new List<TechnicianProfile> { tech }.BuildMock());

            // Mock Booking return null
            _mockBookingRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Booking)null);

            var input = new ConfirmReceiptDto { BookingId = Guid.NewGuid() };

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.ConfirmReceiptAsync(input, tech.User.Id));
        }

        [Fact]
        public async Task Confirm_ShouldReturnFalse_WhenItemIDsDoNotMatch()
        {
            // Arrange
            var data = GetFakeBookingEquipments();
            var booking = data.First().Booking;
            var techUserMsId = booking.Technician.User.Id;

            _mockTechnicianRepo.Setup(r => r.GetAll()).Returns(new List<TechnicianProfile> { booking.Technician }.BuildMock());
            _mockBookingRepo.Setup(r => r.GetByIdAsync(booking.Id)).ReturnsAsync(booking);
            _mockBookingEquipmentRepo.Setup(r => r.GetAll()).Returns(data.BuildMock());

            // Input IDs that don't exist in the mock list
            var input = new ConfirmReceiptDto
            {
                BookingId = booking.Id,
                BookingEquipmentIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() }
            };

            // Act
            var result = await _service.ConfirmReceiptAsync(input, techUserMsId);

            // Assert
            Assert.False(result);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        #endregion
    }
}