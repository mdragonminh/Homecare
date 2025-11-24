using HSP.Core.Constans;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.DTOs.Ticket;
using HSP.Service.Implementations.Internal;
using Microsoft.Extensions.Localization;
using Moq;
using MockQueryable.Moq;
using System.Linq.Expressions;
using Xunit;
using MockQueryable;

namespace HSP.Service.Test.Implementations.Internal
{
    public class TicketServiceTests
    {
        private readonly Mock<IRepository<Ticket, Guid>> _mockTicketRepository;
        private readonly Mock<IRepository<Booking, Guid>> _mockBookingRepository;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<IRepository<Equipment, Guid>> _mockEquipmentRepository;
        private readonly Mock<IRepository<TechnicianProfile, Guid>> _mockTechnicianProfileRepository;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;
        private readonly TicketService _ticketService;

        public TicketServiceTests()
        {
            _mockTicketRepository = new Mock<IRepository<Ticket, Guid>>();
            _mockBookingRepository = new Mock<IRepository<Booking, Guid>>();
            _mockEmailService = new Mock<IEmailService>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockEquipmentRepository = new Mock<IRepository<Equipment, Guid>>();
            _mockTechnicianProfileRepository = new Mock<IRepository<TechnicianProfile, Guid>>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();

            _ticketService = new TicketService(
                _mockTicketRepository.Object,
                _mockBookingRepository.Object,
                _mockEmailService.Object,
                _mockUserRepository.Object,
                _mockEquipmentRepository.Object,
                _mockTechnicianProfileRepository.Object,
                _mockUnitOfWork.Object,
                _mockLocalizer.Object
            );
        }

        #region GetTicketsAsync Tests

        [Fact]
        public async Task GetTicketsAsync_WithCustomerRole_ReturnsOnlyCustomerTickets()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var otherCustomerId = Guid.NewGuid();
            var paginationParams = new PaginationParams { PageNumber = 1, PageSize = 10 };

            var tickets = new List<Ticket>
            {
                new Ticket
                {
                    Id = Guid.NewGuid(),
                    CustomerId = customerId,
                    BookingId = Guid.NewGuid(),
                    IssueDescription = "Issue 1",
                    Status = TicketStatus.Pending,
                    DateCreated = DateTime.UtcNow,
                    IsDeleted = false,
                    Customer = new AppUser { FullName = "Customer 1" }
                },
                new Ticket
                {
                    Id = Guid.NewGuid(),
                    CustomerId = otherCustomerId,
                    BookingId = Guid.NewGuid(),
                    IssueDescription = "Issue 2",
                    Status = TicketStatus.Pending,
                    DateCreated = DateTime.UtcNow,
                    IsDeleted = false,
                    Customer = new AppUser { FullName = "Customer 2" }
                }
            };

            var mockQueryable = tickets.BuildMock();
            _mockTicketRepository.Setup(r => r.GetAll()).Returns(mockQueryable);

            // Act
            var result = await _ticketService.GetTicketsAsync(customerId, RoleNames.Customer, paginationParams);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Items);
            Assert.Equal(customerId, result.Items[0].CustomerId);
        }

        [Fact]
        public async Task GetTicketsAsync_WithSupporterRole_ReturnsUnassignedAndOwnTickets()
        {
            // Arrange
            var supporterId = Guid.NewGuid();
            var paginationParams = new PaginationParams { PageNumber = 1, PageSize = 10 };

            var tickets = new List<Ticket>
    {
        new Ticket
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            SupporterId = null,
            IssueDescription = "Unassigned",
            Status = TicketStatus.NotAccepted,
            DateCreated = DateTime.UtcNow,
            IsDeleted = false,
            Customer = new AppUser { FullName = "Customer 1" }
        },
        new Ticket
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            SupporterId = supporterId,
            IssueDescription = "Assigned to me",
            Status = TicketStatus.Pending,
            DateCreated = DateTime.UtcNow,
            IsDeleted = false,
            Customer = new AppUser { FullName = "Customer 2" }
        },
        new Ticket
        {
            Id = Guid.NewGuid(),
            CustomerId = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            SupporterId = Guid.NewGuid(),     // other supporter
            IssueDescription = "Assigned to other",
            Status = TicketStatus.Pending,
            DateCreated = DateTime.UtcNow,
            IsDeleted = false,
            Customer = new AppUser { FullName = "Customer 3" }
        }
    };

            // Convert to async IQueryable
            var mock = tickets.BuildMock();

            _mockTicketRepository.Setup(r => r.GetAll()).Returns(mock);

            // Act
            var result = await _ticketService.GetTicketsAsync(supporterId, RoleNames.Supporter, paginationParams);

            // Assert
            Assert.NotNull(result);

            // Supporter should get:
            //  - tickets with SupporterId = null
            //  - tickets assigned to himself
            Assert.Equal(2, result.Items.Count);

            Assert.DoesNotContain(result.Items, t => t.IssueDescription == "Assigned to other");
        }


        [Fact]
        public async Task GetTicketsAsync_ExcludesDeletedTickets()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var paginationParams = new PaginationParams { PageNumber = 1, PageSize = 10 };

            // Create 1 active ticket + 1 deleted ticket
            var deletedTicketId = Guid.NewGuid();
            var activeTicketId = Guid.NewGuid();

            var tickets = new List<Ticket>
    {
        new Ticket
        {
            Id = activeTicketId,
            CustomerId = customerId,
            BookingId = Guid.NewGuid(),
            IsDeleted = false,
            Status = TicketStatus.Pending,
            DateCreated = DateTime.UtcNow,
            Customer = new AppUser { FullName = "Customer 1" }
        },
        new Ticket
        {
            Id = deletedTicketId,
            CustomerId = customerId,
            BookingId = Guid.NewGuid(),
            IsDeleted = true,
            Status = TicketStatus.Pending,
            DateCreated = DateTime.UtcNow,
            Customer = new AppUser { FullName = "Customer 2" }
        }
    };

            // Convert to async IQueryable
            var mock = tickets.BuildMock();

            _mockTicketRepository.Setup(r => r.GetAll()).Returns(mock);

            // Act
            var result = await _ticketService.GetTicketsAsync(customerId, RoleNames.Customer, paginationParams);

            // Assert
            Assert.NotNull(result);

            // Chỉ còn 1 ticket (không bị xóa)
            Assert.Single(result.Items);

            // Không chứa ticket đã bị xóa
            Assert.DoesNotContain(result.Items, t => t.Id == deletedTicketId);

            // Chứa ticket active
            Assert.Contains(result.Items, t => t.Id == activeTicketId);
        }


        #endregion

        #region AssignTechnicianAsync Tests

        [Fact]
        public async Task AssignTechnicianAsync_WithValidData_ReturnsTrue()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();
            var techUserId = Guid.NewGuid();

            var assignDto = new AssignTechnicianDto
            {
                TicketId = ticketId,
                TechnicianId = technicianId.ToString()
            };

            var ticket = new Ticket
            {
                Id = ticketId,
                SupporterId = null,
                IssueDescription = "Test Issue",
                DateCreated = DateTime.UtcNow
            };

            var techProfile = new TechnicianProfile
            {
                Id = technicianId,
                UserId = techUserId
            };

            var techUser = new AppUser
            {
                Id = techUserId,
                Email = "tech@example.com",
                FullName = "Tech User"
            };

            _mockTechnicianProfileRepository.Setup(r => r.GetByIdAsync(technicianId))
                .ReturnsAsync(techProfile);
            _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
                .ReturnsAsync(ticket);
            _mockUserRepository.Setup(r => r.FindByIdAsync(techUserId))
                .ReturnsAsync(techUser);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            // Act
            var result = await _ticketService.AssignTechnicianAsync(assignDto, supporterId.ToString());

            // Assert
            Assert.True(result);
            _mockTicketRepository.Verify(r => r.Update(It.Is<Ticket>(t =>
                t.TechnicianId == technicianId &&
                t.SupporterId == supporterId
            )), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
            _mockEmailService.Verify(e => e.SendEmailAsync(It.IsAny<Dtos.EmailDto.EmailDto>()), Times.Once);
        }

        [Fact]
        public async Task AssignTechnicianAsync_WithInvalidSupporterId_ReturnsFalse()
        {
            // Arrange
            var assignDto = new AssignTechnicianDto
            {
                TicketId = Guid.NewGuid(),
                TechnicianId = Guid.NewGuid().ToString()
            };

            // Act
            var result = await _ticketService.AssignTechnicianAsync(assignDto, "invalid-guid");

            // Assert
            Assert.False(result);
            _mockTicketRepository.Verify(r => r.Update(It.IsAny<Ticket>()), Times.Never);
        }

        [Fact]
        public async Task AssignTechnicianAsync_WithInvalidTechnicianId_ReturnsFalse()
        {
            // Arrange
            var assignDto = new AssignTechnicianDto
            {
                TicketId = Guid.NewGuid(),
                TechnicianId = "invalid-guid"
            };

            // Act
            var result = await _ticketService.AssignTechnicianAsync(assignDto, Guid.NewGuid().ToString());

            // Assert
            Assert.False(result);
            _mockTicketRepository.Verify(r => r.Update(It.IsAny<Ticket>()), Times.Never);
        }

        [Fact]
        public async Task AssignTechnicianAsync_WithNonExistentTechnician_ReturnsFalse()
        {
            // Arrange
            var assignDto = new AssignTechnicianDto
            {
                TicketId = Guid.NewGuid(),
                TechnicianId = Guid.NewGuid().ToString()
            };

            _mockTechnicianProfileRepository.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((TechnicianProfile)null);

            // Act
            var result = await _ticketService.AssignTechnicianAsync(assignDto, Guid.NewGuid().ToString());

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task AssignTechnicianAsync_WithNonExistentTicket_ReturnsFalse()
        {
            // Arrange
            var technicianId = Guid.NewGuid();
            var assignDto = new AssignTechnicianDto
            {
                TicketId = Guid.NewGuid(),
                TechnicianId = technicianId.ToString()
            };

            _mockTechnicianProfileRepository.Setup(r => r.GetByIdAsync(technicianId))
                .ReturnsAsync(new TechnicianProfile { Id = technicianId });
            _mockTicketRepository.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Ticket)null);

            // Act
            var result = await _ticketService.AssignTechnicianAsync(assignDto, Guid.NewGuid().ToString());

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task AssignTechnicianAsync_WithDifferentSupporter_ReturnsFalse()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();
            var currentSupporterId = Guid.NewGuid();
            var newSupporterId = Guid.NewGuid();

            var assignDto = new AssignTechnicianDto
            {
                TicketId = ticketId,
                TechnicianId = technicianId.ToString()
            };

            var ticket = new Ticket
            {
                Id = ticketId,
                SupporterId = currentSupporterId
            };

            var techProfile = new TechnicianProfile { Id = technicianId };

            _mockTechnicianProfileRepository.Setup(r => r.GetByIdAsync(technicianId))
                .ReturnsAsync(techProfile);
            _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
                .ReturnsAsync(ticket);

            // Act
            var result = await _ticketService.AssignTechnicianAsync(assignDto, newSupporterId.ToString());

            // Assert
            Assert.False(result);
            _mockTicketRepository.Verify(r => r.Update(It.IsAny<Ticket>()), Times.Never);
        }

        #endregion

        #region UpdateTicketStatusAsync Tests

        [Fact]
        public async Task UpdateTicketStatusAsync_WithValidData_ReturnsTrue()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();

            var updateDto = new UpdateTicketStatusDto
            {
                TicketId = ticketId,
                NewStatus = TicketStatus.InProgress
            };

            var ticket = new Ticket
            {
                Id = ticketId,
                Status = TicketStatus.Pending,
                SupporterId = supporterId
            };

            var supporter = new AppUser
            {
                Id = supporterId,
                Email = "supporter@example.com"
            };

            _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
                .ReturnsAsync(ticket);
            _mockUserRepository.Setup(r => r.FindByIdAsync(supporterId))
                .ReturnsAsync(supporter);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            // Act
            var result = await _ticketService.UpdateTicketStatusAsync(updateDto, supporterId.ToString());

            // Assert
            Assert.True(result);
            Assert.Equal(TicketStatus.InProgress, ticket.Status);
            Assert.NotNull(ticket.StartedAt);
            _mockTicketRepository.Verify(r => r.Update(ticket), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
            _mockEmailService.Verify(e => e.SendEmailAsync(It.IsAny<Dtos.EmailDto.EmailDto>()), Times.Once);
        }

        [Fact]
        public async Task UpdateTicketStatusAsync_ToComplete_SetsCompletedAt()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();

            var updateDto = new UpdateTicketStatusDto
            {
                TicketId = ticketId,
                NewStatus = TicketStatus.Complete
            };

            var ticket = new Ticket
            {
                Id = ticketId,
                Status = TicketStatus.InProgress,
                SupporterId = supporterId,
                StartedAt = DateTime.UtcNow.AddHours(-1)
            };

            var supporter = new AppUser
            {
                Id = supporterId,
                Email = "supporter@example.com"
            };

            _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
                .ReturnsAsync(ticket);
            _mockUserRepository.Setup(r => r.FindByIdAsync(supporterId))
                .ReturnsAsync(supporter);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            // Act
            var result = await _ticketService.UpdateTicketStatusAsync(updateDto, supporterId.ToString());

            // Assert
            Assert.True(result);
            Assert.Equal(TicketStatus.Complete, ticket.Status);
            Assert.NotNull(ticket.CompletedAt);
        }

        [Fact]
        public async Task UpdateTicketStatusAsync_WithSameStatus_ReturnsTrue()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();

            var updateDto = new UpdateTicketStatusDto
            {
                TicketId = ticketId,
                NewStatus = TicketStatus.Pending
            };

            var ticket = new Ticket
            {
                Id = ticketId,
                Status = TicketStatus.Pending,
                SupporterId = supporterId
            };

            _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
                .ReturnsAsync(ticket);

            // Act
            var result = await _ticketService.UpdateTicketStatusAsync(updateDto, supporterId.ToString());

            // Assert
            Assert.True(result);
            _mockTicketRepository.Verify(r => r.Update(It.IsAny<Ticket>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UpdateTicketStatusAsync_WithInvalidSupporterId_ReturnsFalse()
        {
            // Arrange
            var updateDto = new UpdateTicketStatusDto
            {
                TicketId = Guid.NewGuid(),
                NewStatus = TicketStatus.InProgress
            };

            // Act
            var result = await _ticketService.UpdateTicketStatusAsync(updateDto, "invalid-guid");

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task UpdateTicketStatusAsync_WithNonExistentTicket_ReturnsFalse()
        {
            // Arrange
            var updateDto = new UpdateTicketStatusDto
            {
                TicketId = Guid.NewGuid(),
                NewStatus = TicketStatus.InProgress
            };

            _mockTicketRepository.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Ticket)null);

            // Act
            var result = await _ticketService.UpdateTicketStatusAsync(updateDto, Guid.NewGuid().ToString());

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task UpdateTicketStatusAsync_WithDifferentSupporter_ReturnsFalse()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var currentSupporterId = Guid.NewGuid();
            var newSupporterId = Guid.NewGuid();

            var updateDto = new UpdateTicketStatusDto
            {
                TicketId = ticketId,
                NewStatus = TicketStatus.InProgress
            };

            var ticket = new Ticket
            {
                Id = ticketId,
                Status = TicketStatus.Pending,
                SupporterId = currentSupporterId
            };

            _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
                .ReturnsAsync(ticket);

            // Act
            var result = await _ticketService.UpdateTicketStatusAsync(updateDto, newSupporterId.ToString());

            // Assert
            Assert.False(result);
            _mockTicketRepository.Verify(r => r.Update(It.IsAny<Ticket>()), Times.Never);
        }

        [Fact]
        public async Task UpdateTicketStatusAsync_WithNullSupporter_AssignsSupporter()
        {
            // Arrange
            var ticketId = Guid.NewGuid();
            var supporterId = Guid.NewGuid();

            var updateDto = new UpdateTicketStatusDto
            {
                TicketId = ticketId,
                NewStatus = TicketStatus.Pending
            };

            var ticket = new Ticket
            {
                Id = ticketId,
                Status = TicketStatus.NotAccepted,
                SupporterId = null
            };

            var supporter = new AppUser
            {
                Id = supporterId,
                Email = "supporter@example.com"
            };

            _mockTicketRepository.Setup(r => r.GetByIdAsync(ticketId))
                .ReturnsAsync(ticket);
            _mockUserRepository.Setup(r => r.FindByIdAsync(supporterId))
                .ReturnsAsync(supporter);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            // Act
            var result = await _ticketService.UpdateTicketStatusAsync(updateDto, supporterId.ToString());

            // Assert
            Assert.True(result);
            Assert.Equal(supporterId, ticket.SupporterId);
        }

        #endregion

        #region CreateTicketAsync Tests

        [Fact]
        public async Task CreateTicketAsync_WithValidData_CreatesTicket()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            var createDto = new CreateTicketDto
            {
                BookingId = bookingId,
                IssueDescription = "Test issue"
            };

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = customerId,
                Customer = new AppUser { FullName = "Customer Name" }
            };

            _mockBookingRepository.Setup(r => r.GetByIdAsync(bookingId))
                .ReturnsAsync(booking);
            _mockTicketRepository.Setup(r => r.GetAll())
                .Returns(new List<Ticket>().AsQueryable());
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            // Act
            var result = await _ticketService.CreateTicketAsync(createDto, customerId.ToString());

            // Assert
            Assert.NotNull(result);
            Assert.Equal(bookingId, result.BookingId);
            Assert.Equal(customerId, result.CustomerId);
            Assert.Equal("Test issue", result.IssueDescription);
            Assert.Equal(TicketStatus.NotAccepted.ToString(), result.Status);
            _mockTicketRepository.Verify(r => r.AddAsync(It.IsAny<Ticket>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task CreateTicketAsync_WithInvalidUserId_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var createDto = new CreateTicketDto
            {
                BookingId = Guid.NewGuid(),
                IssueDescription = "Test issue"
            };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _ticketService.CreateTicketAsync(createDto, "invalid-guid"));
        }

        [Fact]
        public async Task CreateTicketAsync_WithNonExistentBooking_ThrowsKeyNotFoundException()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var createDto = new CreateTicketDto
            {
                BookingId = Guid.NewGuid(),
                IssueDescription = "Test issue"
            };

            _mockBookingRepository.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Booking)null);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _ticketService.CreateTicketAsync(createDto, customerId.ToString()));
        }

        [Fact]
        public async Task CreateTicketAsync_WithDifferentCustomer_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var otherCustomerId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            var createDto = new CreateTicketDto
            {
                BookingId = bookingId,
                IssueDescription = "Test issue"
            };

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = otherCustomerId
            };

            _mockBookingRepository.Setup(r => r.GetByIdAsync(bookingId))
                .ReturnsAsync(booking);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _ticketService.CreateTicketAsync(createDto, customerId.ToString()));
            Assert.Contains("chính mình", exception.Message);
        }

        [Fact]
        public async Task CreateTicketAsync_WithExistingTicket_ThrowsInvalidOperationException()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            var createDto = new CreateTicketDto
            {
                BookingId = bookingId,
                IssueDescription = "Test issue"
            };

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = customerId
            };

            var existingTicket = new Ticket
            {
                Id = Guid.NewGuid(),
                BookingId = bookingId,
                IsDeleted = false
            };

            _mockBookingRepository.Setup(r => r.GetByIdAsync(bookingId))
                .ReturnsAsync(booking);
            _mockTicketRepository.Setup(r => r.GetAll())
                .Returns(new List<Ticket> { existingTicket }.AsQueryable());

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _ticketService.CreateTicketAsync(createDto, customerId.ToString()));
            Assert.Contains("đã có ticket", exception.Message);
        }

        [Fact]
        public async Task CreateTicketAsync_WithDeletedTicket_CreatesNewTicket()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var bookingId = Guid.NewGuid();

            var createDto = new CreateTicketDto
            {
                BookingId = bookingId,
                IssueDescription = "Test issue"
            };

            var booking = new Booking
            {
                Id = bookingId,
                CustomerId = customerId,
                Customer = new AppUser { FullName = "Customer Name" }
            };

            var deletedTicket = new Ticket
            {
                Id = Guid.NewGuid(),
                BookingId = bookingId,
                IsDeleted = true
            };

            _mockBookingRepository.Setup(r => r.GetByIdAsync(bookingId))
                .ReturnsAsync(booking);
            _mockTicketRepository.Setup(r => r.GetAll())
                .Returns(new List<Ticket> { deletedTicket }.AsQueryable());
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            // Act
            var result = await _ticketService.CreateTicketAsync(createDto, customerId.ToString());

            // Assert
            Assert.NotNull(result);
            _mockTicketRepository.Verify(r => r.AddAsync(It.IsAny<Ticket>()), Times.Once);
        }

        #endregion
    }
}

