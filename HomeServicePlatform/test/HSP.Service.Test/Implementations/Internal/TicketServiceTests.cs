using HSP.Core.Constans;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.DTOs.Ticket;
using HSP.Service.Implementations.Internal;
using HSP.Service.Interfaces;
using Microsoft.Extensions.Localization;
using MockQueryable;
using MockQueryable.Moq;
using Moq;
using Xunit; // Sử dụng thư viện chuẩn của xUnit

namespace HSP.Service.Test.Implementations.Internal
{
    public class TicketServiceTests
    {
        private readonly Mock<IRepository<Ticket, Guid>> _mockTicketRepo;
        private readonly Mock<IRepository<Booking, Guid>> _mockBookingRepo;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IUserRepository> _mockUserRepo;
        private readonly Mock<IRepository<Equipment, Guid>> _mockEquipmentRepo;
        private readonly Mock<IRepository<TechnicianProfile, Guid>> _mockTechProfileRepo;
        private readonly Mock<IRepository<BookingFeedback, Guid>> _mockFeedbackRepo;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;

        private readonly TicketService _ticketService;

        public TicketServiceTests()
        {
            _mockTicketRepo = new Mock<IRepository<Ticket, Guid>>();
            _mockBookingRepo = new Mock<IRepository<Booking, Guid>>();
            _mockEmailService = new Mock<IEmailService>();
            _mockUserRepo = new Mock<IUserRepository>();
            _mockEquipmentRepo = new Mock<IRepository<Equipment, Guid>>();
            _mockTechProfileRepo = new Mock<IRepository<TechnicianProfile, Guid>>();
            _mockFeedbackRepo = new Mock<IRepository<BookingFeedback, Guid>>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();

            _mockLocalizer.Setup(l => l[It.IsAny<string>()]).Returns((string key) => new LocalizedString(key, key));

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            _ticketService = new TicketService(
                _mockTicketRepo.Object,
                _mockBookingRepo.Object,
                _mockEmailService.Object,
                _mockUserRepo.Object,
                _mockEquipmentRepo.Object,
                _mockTechProfileRepo.Object,
                _mockFeedbackRepo.Object,
                _mockUnitOfWork.Object,
                _mockLocalizer.Object
            );
        }

        #region CreateTicketAsync Tests

        [Fact]
        public async Task CreateTicketAsync_ShouldThrow_WhenBookingNotFound()
        {
            // Arrange
            var createDto = new CreateTicketDto { BookingId = Guid.NewGuid() };
            var userId = Guid.NewGuid().ToString();

            _mockBookingRepo.Setup(x => x.GetAll()).Returns(new List<Booking>().BuildMock());

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _ticketService.CreateTicketAsync(createDto, userId));

            Assert.Equal("Không tìm thấy Booking.", exception.Message);
        }

        [Fact]
        public async Task CreateTicketAsync_ShouldThrow_WhenUserIsNotOwner()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var customerId = Guid.NewGuid();
            var otherUserId = Guid.NewGuid();
            var createDto = new CreateTicketDto { BookingId = bookingId };

            var booking = new Booking { Id = bookingId, CustomerId = customerId };
            _mockBookingRepo.Setup(x => x.GetAll()).Returns(new List<Booking> { booking }.BuildMock());

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _ticketService.CreateTicketAsync(createDto, otherUserId.ToString()));
        }

        [Fact]
        public async Task CreateTicketAsync_ShouldThrow_WhenTicketAlreadyExists()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var createDto = new CreateTicketDto { BookingId = bookingId };

            var booking = new Booking { Id = bookingId, CustomerId = userId };
            var existingTicket = new Ticket { BookingId = bookingId, IsDeleted = false };

            _mockBookingRepo.Setup(x => x.GetAll()).Returns(new List<Booking> { booking }.BuildMock());
            _mockTicketRepo.Setup(x => x.GetAll()).Returns(new List<Ticket> { existingTicket }.BuildMock());

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _ticketService.CreateTicketAsync(createDto, userId.ToString()));

            Assert.Equal("Booking này đã có ticket đang được xử lý.", exception.Message);
        }

        [Fact]
        public async Task CreateTicketAsync_ShouldSuccess_AndSendEmail_WhenTechnicianAssigned()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();

            var createDto = new CreateTicketDto { BookingId = bookingId, IssueDescription = "Broken", IsRefundRequested = true };

            var techUser = new AppUser { Id = techUserId, Email = "tech@test.com", FullName = "Tech Name" };
            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = userId,
                TechnicianId = techId,
                Technician = new TechnicianProfile { Id = techId, UserId = techUserId, User = techUser },
                Customer = new AppUser { FullName = "Customer Name" }
            };

            _mockBookingRepo.Setup(x => x.GetAll()).Returns(new List<Booking> { booking }.BuildMock());
            _mockTicketRepo.Setup(x => x.GetAll()).Returns(new List<Ticket>().BuildMock());
            _mockUserRepo.Setup(x => x.FindByIdAsync(techUserId)).ReturnsAsync(techUser);

            // Act
            var result = await _ticketService.CreateTicketAsync(createDto, userId.ToString());

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Broken", result.IssueDescription);
            Assert.Equal(TicketStatus.NotAccepted.ToString(), result.Status);

            _mockTicketRepo.Verify(x => x.AddAsync(It.IsAny<Ticket>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.Is<EmailDto>(e => e.ToEmail == "tech@test.com")), Times.Once);
        }

        [Fact]
        public async Task CreateTicketAsync_ShouldCreateWithoutTechnician_WhenBookingHasNoTechnician()
        {
            // Arrange
            var bookingId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var createDto = new CreateTicketDto { BookingId = bookingId, IssueDescription = "Issue" };

            // Booking không có TechnicianId
            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = userId,
                TechnicianId = null,
                Technician = null,
                Customer = new AppUser { FullName = "Customer" }
            };

            _mockBookingRepo.Setup(x => x.GetAll()).Returns(new List<Booking> { booking }.BuildMock());
            _mockTicketRepo.Setup(x => x.GetAll()).Returns(new List<Ticket>().BuildMock());

            // Act
            var result = await _ticketService.CreateTicketAsync(createDto, userId.ToString());

            // Assert
            Assert.NotNull(result);
            Assert.Null(result.TechnicianId); // Ticket không có Tech
            Assert.Equal("Not assigned", result.TechnicianName);

            _mockTicketRepo.Verify(x => x.AddAsync(It.IsAny<Ticket>()), Times.Once);
            // Verify rằng Email KHÔNG được gửi đi
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
        }

        [Fact]
        public async Task CreateTicketAsync_ShouldThrowException_WhenUserIdIsInvalidGuid()
        {
            // Arrange
            // Tham số userId không phải là GUID hợp lệ
            var invalidUserId = "MALFORMED_USER_ID";
            var createDto = new CreateTicketDto { BookingId = Guid.NewGuid() };

            // Act & Assert
            // Kiểm tra ngoại lệ UnauthorizedAccessException và message tương ứng
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _ticketService.CreateTicketAsync(createDto, invalidUserId));

            Assert.Equal("User ID không hợp lệ.", exception.Message);
            // Đảm bảo không có thao tác DB nào xảy ra sau khi ném ngoại lệ
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        #endregion

        #region AssignTechnicianAsync Tests

        [Fact]
        public async Task AssignTechnicianAsync_ShouldReturnFalse_WhenSupporterMismatch()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();
            var otherSupporterId = Guid.NewGuid();
            var techId = Guid.NewGuid();

            var dto = new AssignTechnicianDto { TicketId = ticketId, TechnicianId = techId.ToString() };
            var ticket = new Ticket { Id = ticketId, SupporterId = otherSupporterId };
            var techProfile = new TechnicianProfile { Id = techId };

            _mockTechProfileRepo.Setup(x => x.GetByIdAsync(techId)).ReturnsAsync(techProfile);
            _mockTicketRepo.Setup(x => x.GetByIdAsync(ticketId)).ReturnsAsync(ticket);

            // Act
            var result = await _ticketService.AssignTechnicianAsync(dto, supporterId.ToString());

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task AssignTechnicianAsync_ShouldAssign_WhenValid()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();

            var dto = new AssignTechnicianDto { TicketId = ticketId, TechnicianId = techId.ToString() };

            var ticket = new Ticket { Id = ticketId, SupporterId = null };
            var techUser = new AppUser { Id = techUserId, Email = "tech@test.com" };
            var techProfile = new TechnicianProfile { Id = techId, UserId = techUserId };

            _mockTechProfileRepo.Setup(x => x.GetByIdAsync(techId)).ReturnsAsync(techProfile);
            _mockTicketRepo.Setup(x => x.GetByIdAsync(ticketId)).ReturnsAsync(ticket);
            _mockUserRepo.Setup(x => x.FindByIdAsync(techUserId)).ReturnsAsync(techUser);

            // Act
            var result = await _ticketService.AssignTechnicianAsync(dto, supporterId.ToString());

            // Assert
            Assert.True(result);
            Assert.Equal(supporterId, ticket.SupporterId);
            Assert.Equal(techId, ticket.TechnicianId);

            _mockTicketRepo.Verify(x => x.Update(ticket), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Once);
        }

        [Fact]
        public async Task AssignTechnicianAsync_ShouldReturnFalse_WhenTechnicianNotFound()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();
            var dto = new AssignTechnicianDto { TicketId = ticketId, TechnicianId = techId.ToString() };

            // Mock Tech Repo return null
            _mockTechProfileRepo.Setup(x => x.GetByIdAsync(techId)).ReturnsAsync((TechnicianProfile?)null);

            // Act
            var result = await _ticketService.AssignTechnicianAsync(dto, supporterId.ToString());

            // Assert
            Assert.False(result);
            _mockTicketRepo.Verify(x => x.Update(It.IsAny<Ticket>()), Times.Never);
        }

        [Fact]
        public async Task AssignTechnicianAsync_ShouldReturnFalse_WhenTicketNotFound()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();
            var dto = new AssignTechnicianDto { TicketId = ticketId, TechnicianId = techId.ToString() };

            var techProfile = new TechnicianProfile { Id = techId };
            _mockTechProfileRepo.Setup(x => x.GetByIdAsync(techId)).ReturnsAsync(techProfile);

            // Mock Ticket Repo return null
            _mockTicketRepo.Setup(x => x.GetByIdAsync(ticketId)).ReturnsAsync((Ticket?)null);

            // Act
            var result = await _ticketService.AssignTechnicianAsync(dto, supporterId.ToString());

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task AssignTechnicianAsync_ShouldReturnFalse_WhenSupporterIdIsInvalidGuid()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            // Tham số supporterId không phải là GUID hợp lệ
            var invalidSupporterId = "INVALID_GUID_STRING";
            var dto = new AssignTechnicianDto { TicketId = ticketId, TechnicianId = techId.ToString() };

            // Act
            var result = await _ticketService.AssignTechnicianAsync(dto, invalidSupporterId);

            // Assert
            Assert.False(result); // Phải trả về false
            // Đảm bảo không có thao tác DB nào xảy ra sau validation thất bại
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        #endregion

        #region UpdateTicketStatusAsync Tests

        [Fact]
        public async Task UpdateTicketStatusAsync_ShouldUpdateTimestamps_AndSendEmails()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            var dto = new UpdateTicketStatusDto { TicketId = ticketId, NewStatus = TicketStatus.InProgress };

            var ticket = new Ticket
            {
                Id = ticketId,
                SupporterId = supporterId,
                CustomerId = customerId,
                Status = TicketStatus.Pending,
                StartedAt = null
            };

            var customer = new AppUser { Id = customerId, Email = "cust@test.com", FullName = "Cust" };
            var supporter = new AppUser { Id = supporterId, Email = "sup@test.com", FullName = "Sup" };

            _mockTicketRepo.Setup(x => x.GetByIdAsync(ticketId)).ReturnsAsync(ticket);
            _mockUserRepo.Setup(x => x.FindByIdAsync(customerId)).ReturnsAsync(customer);
            _mockUserRepo.Setup(x => x.FindByIdAsync(supporterId)).ReturnsAsync(supporter);

            // Act
            var result = await _ticketService.UpdateTicketStatusAsync(dto, supporterId.ToString());

            // Assert
            Assert.True(result);
            Assert.Equal(TicketStatus.InProgress, ticket.Status);
            Assert.NotNull(ticket.StartedAt);

            _mockTicketRepo.Verify(x => x.Update(ticket), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.Is<EmailDto>(e => e.ToEmail == "cust@test.com")), Times.Once);
            _mockEmailService.Verify(x => x.SendEmailAsync(It.Is<EmailDto>(e => e.ToEmail == "sup@test.com")), Times.Once);
        }

        [Fact]
        public async Task UpdateTicketStatusAsync_ShouldUpdateCompletedAt_WhenComplete()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();
            var dto = new UpdateTicketStatusDto { TicketId = ticketId, NewStatus = TicketStatus.Complete };
            var ticket = new Ticket { Id = ticketId, SupporterId = supporterId, Status = TicketStatus.InProgress };

            _mockTicketRepo.Setup(x => x.GetByIdAsync(ticketId)).ReturnsAsync(ticket);

            // Act
            await _ticketService.UpdateTicketStatusAsync(dto, supporterId.ToString());

            // Assert
            Assert.NotNull(ticket.CompletedAt);
        }

        [Fact]
        public async Task UpdateTicketStatusAsync_ShouldReturnFalse_WhenTicketNotFound()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var updateDto = new UpdateTicketStatusDto { TicketId = ticketId, NewStatus = TicketStatus.InProgress };

            _mockTicketRepo.Setup(x => x.GetByIdAsync(ticketId)).ReturnsAsync((Ticket?)null);

            // Act
            var result = await _ticketService.UpdateTicketStatusAsync(updateDto, Guid.NewGuid().ToString());

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task UpdateTicketStatusAsync_ShouldDoNothing_WhenStatusIsUnchanged()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();
            var status = TicketStatus.InProgress;

            var updateDto = new UpdateTicketStatusDto { TicketId = ticketId, NewStatus = status };
            var ticket = new Ticket
            {
                Id = ticketId,
                SupporterId = supporterId,
                Status = status // Trạng thái cũ giống trạng thái mới
            };

            _mockTicketRepo.Setup(x => x.GetByIdAsync(ticketId)).ReturnsAsync(ticket);

            // Act
            var result = await _ticketService.UpdateTicketStatusAsync(updateDto, supporterId.ToString());

            // Assert
            Assert.True(result);
            // Verify rằng Update và SaveChanges KHÔNG BAO GIỜ được gọi
            _mockTicketRepo.Verify(x => x.Update(It.IsAny<Ticket>()), Times.Never);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UpdateTicketStatusAsync_ShouldNotUpdateStartedAt_IfAlreadySet()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();
            var oldDate = DateTime.UtcNow.AddDays(-1);

            var updateDto = new UpdateTicketStatusDto { TicketId = ticketId, NewStatus = TicketStatus.InProgress };
            var ticket = new Ticket
            {
                Id = ticketId,
                SupporterId = supporterId,
                Status = TicketStatus.Pending,
                StartedAt = oldDate // Đã có ngày bắt đầu
            };

            _mockTicketRepo.Setup(x => x.GetByIdAsync(ticketId)).ReturnsAsync(ticket);

            // Act
            await _ticketService.UpdateTicketStatusAsync(updateDto, supporterId.ToString());

            // Assert
            Assert.Equal(oldDate, ticket.StartedAt); // Ngày bắt đầu phải giữ nguyên, không được update thành Now
            _mockTicketRepo.Verify(x => x.Update(ticket), Times.Once);
        }

        [Fact]
        public async Task UpdateTicketStatusAsync_ShouldReturnFalse_WhenUnauthorizedUserAttemptsUpdate()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var assignedSupporterId = Guid.NewGuid();
            var maliciousUserId = Guid.NewGuid(); // User không được gán ticket

            var dto = new UpdateTicketStatusDto { TicketId = ticketId, NewStatus = TicketStatus.Complete };
            var ticket = new Ticket
            {
                Id = ticketId,
                SupporterId = assignedSupporterId, // Ticket được gán cho người khác
                Status = TicketStatus.InProgress
            };

            _mockTicketRepo.Setup(x => x.GetByIdAsync(ticketId)).ReturnsAsync(ticket);

            // Mock UserRepository để mô phỏng rằng người dùng không có vai trò đặc biệt
            // (Trong logic, chỉ Supporter được gán mới có quyền. Admin/Operator được kiểm tra ở cấp Controller/Service cao hơn)

            // Act
            var result = await _ticketService.UpdateTicketStatusAsync(dto, maliciousUserId.ToString());

            // Assert
            Assert.False(result);
            // Xác nhận không có cập nhật nào xảy ra
            _mockTicketRepo.Verify(x => x.Update(It.IsAny<Ticket>()), Times.Never);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UpdateTicketStatusAsync_ShouldNotCrash_IfCustomerOrSupporterUserIsMissing()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();
            var customerId = Guid.NewGuid();

            var dto = new UpdateTicketStatusDto { TicketId = ticketId, NewStatus = TicketStatus.Complete };
            var ticket = new Ticket
            {
                Id = ticketId,
                SupporterId = supporterId,
                CustomerId = customerId,
                Status = TicketStatus.InProgress
            };

            // 1. Ticket tìm thấy
            _mockTicketRepo.Setup(x => x.GetByIdAsync(ticketId)).ReturnsAsync(ticket);

            // 2. Customer User bị thiếu (FindByIdAsync trả về null)
            _mockUserRepo.Setup(x => x.FindByIdAsync(customerId)).ReturnsAsync((AppUser?)null);

            // 3. Supporter User bị thiếu
            _mockUserRepo.Setup(x => x.FindByIdAsync(supporterId)).ReturnsAsync((AppUser?)null);

            // Act
            var act = async () => await _ticketService.UpdateTicketStatusAsync(dto, supporterId.ToString());

            // Assert - Kiểm tra rằng hàm chạy hoàn tất mà KHÔNG ném ra ngoại lệ
            await act();

            // Xác nhận rằng trạng thái vẫn được cập nhật trong DB
            Assert.Equal(TicketStatus.Complete, ticket.Status);
            _mockTicketRepo.Verify(x => x.Update(ticket), Times.Once);

            // Xác nhận rằng EmailService được gọi nhưng không bị lỗi (vì cả 2 user đều null)
            _mockEmailService.Verify(x => x.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
        }

        //[Fact]
        //public async Task UpdateTicketStatusAsync_ShouldReturnFalse_WhenUpdatingUnassignedTicketAsNonAdmin()
        //{
        //    // Arrange
        //    var ticketId = Guid.NewGuid();
        //    var unauthorizedUserId = Guid.NewGuid(); // User bất kỳ không phải Admin
        //    var dto = new UpdateTicketStatusDto { TicketId = ticketId, NewStatus = TicketStatus.InProgress };

        //    var ticket = new Ticket
        //    {
        //        Id = ticketId,
        //        SupporterId = null, // Ticket chưa được gán
        //        CustomerId = Guid.NewGuid(),
        //        Status = TicketStatus.Pending
        //    };

        //    _mockTicketRepo.Setup(x => x.GetByIdAsync(ticketId)).ReturnsAsync(ticket);

        //    // Act
        //    // Giả định người dùng này không có vai trò đặc biệt để bypass quyền
        //    var result = await _ticketService.UpdateTicketStatusAsync(dto, unauthorizedUserId.ToString());

        //    // Assert
        //    // Thao tác phải thất bại vì người dùng không phải Supporter được gán và cũng không phải Admin (giả định)
        //    Assert.False(result);
        //    _mockTicketRepo.Verify(x => x.Update(It.IsAny<Ticket>()), Times.Never);
        //    _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never);
        //}

        #endregion

        #region GetTicketsAsync Tests

        [Fact]
        public async Task GetTicketsAsync_ShouldReturnPagedList_WithRatings_ForCustomer()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var techId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();
            var ticketId = Guid.NewGuid();

            var paginationParams = new PaginationParams { PageNumber = 1, PageSize = 10, OrderBy = "" };

            var tickets = new List<Ticket>
            {
                new Ticket
                {
                    Id = ticketId,
                    CustomerId = customerId,
                    TechnicianId = techId,
                    BookingId = bookingId,
                    Status = TicketStatus.Pending,
                    DateCreated = DateTime.UtcNow,
                    IsDeleted = false,
                    Customer = new AppUser { Id = customerId, FullName = "Customer A" },
                    Booking = new Booking
                    {
                        Id = bookingId,
                        CustomerId = customerId,
                        TechnicianId = techId,
                        Customer = new AppUser { FullName = "Customer A", PhoneNumber = "123" },
                        Technician = new TechnicianProfile { User = new AppUser { FullName = "Tech A" } },
                        Payments = new List<Payment>
                        {
                            new Payment { Id = Guid.NewGuid(), Amount = 100, Status = PaymentStatus.Completed }
                        }
                    },
                    Technician = new TechnicianProfile { User = new AppUser { FullName = "Tech A" } }
                }
            };

            var bookings = new List<Booking>
            {
                new Booking
                {
                    Id = bookingId,
                    CustomerId = customerId,
                    TechnicianId = techId,
                    Feedbacks = new List<BookingFeedback>
                    {
                        new BookingFeedback { Rating = 4 },
                        new BookingFeedback { Rating = 5 }
                    }
                }
            };

            _mockTicketRepo.Setup(x => x.GetAll()).Returns(tickets.BuildMock());
            _mockBookingRepo.Setup(x => x.GetAll()).Returns(bookings.BuildMock());

            // Act
            var result = await _ticketService.GetTicketsAsync(customerId, RoleNames.Customer, paginationParams);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items); // Kiểm tra số lượng item là 1

            var dto = result.Items.First();
            Assert.Equal(ticketId, dto.Id);

            Assert.NotNull(dto.BookingDetail);
            Assert.NotNull(dto.BookingDetail.Customer);
            Assert.Equal(4.5, dto.BookingDetail.Customer.AverageRating); // (4+5)/2

            Assert.NotNull(dto.PaymentDetail);
            Assert.Equal(100, dto.PaymentDetail.Amount);
        }

        [Fact]
        public async Task GetTicketsAsync_ShouldFilterBySupporter()
        {
            // Arrange
            var supporterId = Guid.NewGuid();
            var otherSupporterId = Guid.NewGuid();

            var tickets = new List<Ticket>
            {
                new Ticket { Id = Guid.NewGuid(), SupporterId = supporterId, IsDeleted = false },
                new Ticket { Id = Guid.NewGuid(), SupporterId = null, IsDeleted = false },
                new Ticket { Id = Guid.NewGuid(), SupporterId = otherSupporterId, IsDeleted = false }
            };

            _mockTicketRepo.Setup(x => x.GetAll()).Returns(tickets.BuildMock());
            _mockBookingRepo.Setup(x => x.GetAll()).Returns(new List<Booking>().BuildMock());

            // Act
            var result = await _ticketService.GetTicketsAsync(supporterId, RoleNames.Supporter, new PaginationParams());

            // Assert
            Assert.Equal(2, result.TotalCount);
        }

        //[Fact]
        //public async Task GetTicketsAsync_ShouldReturnAllTickets_ForAdmin_AndHandleZeroRatings()
        //{
        //    // Arrange
        //    var adminId = Guid.NewGuid();
        //    var bookingId = Guid.NewGuid();
        //    var customerId = Guid.NewGuid();

        //    var paginationParams = new PaginationParams { PageNumber = 1, PageSize = 10 };

        //    var tickets = new List<Ticket>
        //    {
        //        new Ticket
        //        {
        //            Id = Guid.NewGuid(),
        //            BookingId = bookingId,
        //            IsDeleted = false,
        //            Customer = new AppUser(),
        //            Booking = new Booking { Id = bookingId, CustomerId = customerId }
        //        }
        //    };

        //    // Booking không có feedback => Rating sẽ là 0
        //    var bookings = new List<Booking>
        //    {
        //        new Booking { Id = bookingId, CustomerId = customerId, Feedbacks = new List<BookingFeedback>() }
        //    };

        //    _mockTicketRepo.Setup(x => x.GetAll()).Returns(tickets.BuildMock());
        //    _mockBookingRepo.Setup(x => x.GetAll()).Returns(bookings.BuildMock());

        //    // Act - Truyền role là "Admin"
        //    var result = await _ticketService.GetTicketsAsync(adminId, "Admin", paginationParams);

        //    // Assert
        //    Assert.Equal(1, result.TotalCount);

        //    var item = result.Items.First();
        //    // Kiểm tra logic xử lý chia cho 0 trong code
        //    // (AverageRating = ... .Any() ? Average() : 0)
        //    Assert.Equal(0, item.BookingDetail?.Customer?.AverageRating);
        //    Assert.Equal(0, item.BookingDetail?.Customer?.TotalReviews);
        //}

        //[Fact]
        //public async Task GetTicketsAsync_ShouldCalculateTechnicianRatingsCorrectly()
        //{
        //    // Arrange
        //    var customerId = Guid.NewGuid();
        //    var techId = Guid.NewGuid();
        //    var bookingId = Guid.NewGuid();
        //    var ticketId = Guid.NewGuid();

        //    var paginationParams = new PaginationParams { PageNumber = 1, PageSize = 10 };

        //    var techUser = new AppUser { Id = Guid.NewGuid(), FullName = "Tech X" };
        //    var techProfile = new TechnicianProfile { Id = techId, UserId = techUser.Id, User = techUser };

        //    var tickets = new List<Ticket>
        //    {
        //        new Ticket
        //        {
        //            Id = ticketId,
        //            CustomerId = customerId,
        //            TechnicianId = techId,
        //            BookingId = bookingId,
        //            Customer = new AppUser { FullName = "Customer A" },
        //            Technician = techProfile,
        //            Booking = new Booking { Id = bookingId, TechnicianId = techId, CustomerId = customerId }
        //        }
        //    };

        //    // Tạo 3 booking với các feedback khác nhau để tính trung bình
        //    var bookings = new List<Booking>
        //    {
        //        new Booking
        //        {
        //            Id = Guid.NewGuid(),
        //            TechnicianId = techId, // Tech hoàn thành booking này
        //            Feedbacks = new List<BookingFeedback> { new BookingFeedback { Rating = 5 } }
        //        },
        //        new Booking
        //        {
        //            Id = bookingId,
        //            TechnicianId = techId, // Tech hoàn thành booking này
        //            Feedbacks = new List<BookingFeedback> { new BookingFeedback { Rating = 4 } }
        //        },
        //        new Booking // Booking này không liên quan đến techId
        //        {
        //            Id = Guid.NewGuid(),
        //            TechnicianId = Guid.NewGuid(),
        //            Feedbacks = new List<BookingFeedback> { new BookingFeedback { Rating = 1 } }
        //        }
        //    };

        //    _mockTicketRepo.Setup(x => x.GetAll()).Returns(tickets.BuildMock());
        //    _mockBookingRepo.Setup(x => x.GetAll()).Returns(bookings.BuildMock());

        //    // Act - Lấy danh sách với vai trò Admin (để lấy được ticket)
        //    var result = await _ticketService.GetTicketsAsync(Guid.NewGuid(), RoleNames.Admin, paginationParams);

        //    // Assert
        //    Assert.Single(result.Items);
        //    var dto = result.Items.First();

        //    // Rating tính: (5 + 4) / 2 = 4.5
        //    Assert.NotNull(dto.BookingDetail?.Technician);
        //    Assert.Equal(4.5, dto.BookingDetail.Technician.AverageRating);
        //    Assert.Equal(2, dto.BookingDetail.Technician.TotalReviews);
        //}

        [Fact]
        public async Task GetTicketsAsync_ShouldMapBookingItemsAndHandleNulls()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();
            var ticketId = Guid.NewGuid();
            var paginationParams = new PaginationParams { PageNumber = 1, PageSize = 10 };

            // 1. Dữ liệu Items: Một service hợp lệ, một service.Name là NULL
            var bookingItems = new List<BookingItem>
            {
                // Sửa: Thêm namespace đầy đủ cho Service Entity
                new BookingItem { Service = new HSP.Core.Entities.Service { Name = "Valid Service" }, Price = 150m },
                new BookingItem { Service = null, Price = 50m }
            };

            // 2. Dữ liệu Equipments: Một equipment hợp lệ, một equipment.Name là NULL
            var bookingEquipments = new List<BookingEquipment>
            {
                // Sửa: Thêm namespace đầy đủ cho Equipment Entity
                new BookingEquipment { Equipment = new HSP.Core.Entities.Equipment { Name = "Valid Equip" }, Quantity = 1, UnitPrice = 10m },
                new BookingEquipment { Equipment = null, Quantity = 2, UnitPrice = 20m }
            };

            var tickets = new List<Ticket>
            {
                new Ticket
                {
                    Id = ticketId,
                    CustomerId = customerId,
                    IsDeleted = false,
                    Customer = new AppUser(),
                    Booking = new Booking
                    {
                        Id = bookingId,
                        CustomerId = customerId,
                        Items = bookingItems,
                        Equipments = bookingEquipments
                    }
                }
            };

            // Setup Mocks
            _mockTicketRepo.Setup(x => x.GetAll()).Returns(tickets.BuildMock());
            _mockBookingRepo.Setup(x => x.GetAll()).Returns(new List<Booking>().BuildMock());

            // Act
            var result = await _ticketService.GetTicketsAsync(customerId, RoleNames.Customer, paginationParams);

            // Assert
            Assert.Single(result.Items);
            var dto = result.Items.First();

            // 1. Kiểm tra Services mapping
            Assert.NotNull(dto.BookingDetail?.Services);
            Assert.Equal(2, dto.BookingDetail.Services.Count);
            Assert.Equal("Valid Service", dto.BookingDetail.Services[0].Name);
            Assert.Equal("Unknown", dto.BookingDetail.Services[1].Name);

            // 2. Kiểm tra Equipments mapping
            Assert.NotNull(dto.BookingDetail.Equipments);
            Assert.Equal(2, dto.BookingDetail.Equipments.Count);
            Assert.Equal("Valid Equip", dto.BookingDetail.Equipments[0].Name);
            Assert.Equal("Unknown", dto.BookingDetail.Equipments[1].Name);
        }

        #endregion
    }
}