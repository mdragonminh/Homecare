using HSP.Core.Dtos.AuditLogDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations.Internal;
using Microsoft.Extensions.Localization;
using MockQueryable;
using Moq;
using System.Linq.Expressions;
using Xunit;

namespace HSP.Service.Test.Implementations.Internal
{
    public class AuditLogServiceTest
    {
        private readonly Mock<IRepository<AuditLog, Guid>> _mockRepo;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;
        private readonly AuditLogService _service;

        public AuditLogServiceTest()
        {
            _mockRepo = new Mock<IRepository<AuditLog, Guid>>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();

            _service = new AuditLogService(
                _mockRepo.Object,
                _mockUnitOfWork.Object,
                _mockLocalizer.Object
            );
        }

        // ============================================================
        // TEST: GetAllAuditLogsAsync
        // ============================================================

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldReturnAllLogs_WhenNoFilters()
        {
            // Arrange
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = DateTime.UtcNow
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Customer",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = DateTime.UtcNow.AddHours(-1)
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldFilterByUserRole()
        {
            // Arrange
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "admin1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = DateTime.UtcNow
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "customer1",
                    UserRole = "Customer",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = DateTime.UtcNow
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                UserRole = "Admin",
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal("Admin", result.Items.First().UserRole);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldFilterByUserId()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = DateTime.UtcNow
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Customer",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = DateTime.UtcNow
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                UserId = userId,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal(userId, result.Items.First().UserId);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldFilterByAction()
        {
            // Arrange
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = DateTime.UtcNow
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Admin",
                    Action = AuditAction.Delete,
                    EntityName = "Booking",
                    DateCreated = DateTime.UtcNow
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                Action = AuditAction.Create,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal(AuditAction.Create, result.Items.First().Action);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldFilterByEntityName()
        {
            // Arrange
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = DateTime.UtcNow
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Admin",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = DateTime.UtcNow
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                EntityName = "User",
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal("User", result.Items.First().EntityName);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldFilterByFromDate()
        {
            // Arrange
            var baseDate = DateTime.UtcNow.AddDays(-10);
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = baseDate.AddDays(-5)
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Admin",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = baseDate.AddDays(5)
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                FromDate = baseDate,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.True(result.Items.First().DateCreated >= baseDate);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldFilterByToDate()
        {
            // Arrange
            var baseDate = DateTime.UtcNow.AddDays(-10);
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = baseDate.AddDays(-5)
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Admin",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = baseDate.AddDays(5)
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                ToDate = baseDate,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.True(result.Items.First().DateCreated <= baseDate);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldFilterByDateRange()
        {
            // Arrange
            var startDate = DateTime.UtcNow.AddDays(-10);
            var endDate = DateTime.UtcNow.AddDays(-5);
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = startDate.AddDays(-2)
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Admin",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = startDate.AddDays(2)
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user3",
                    UserRole = "Admin",
                    Action = AuditAction.Delete,
                    EntityName = "Service",
                    DateCreated = endDate.AddDays(2)
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                FromDate = startDate,
                ToDate = endDate,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.True(result.Items.First().DateCreated >= startDate && result.Items.First().DateCreated <= endDate);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldFilterBySearchTerm_UserName()
        {
            // Arrange
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "john_doe",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = DateTime.UtcNow
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "jane_smith",
                    UserRole = "Admin",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = DateTime.UtcNow
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                SearchTerm = "john",
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Contains("john", result.Items.First().UserName, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldFilterBySearchTerm_EntityName()
        {
            // Arrange
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = DateTime.UtcNow
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Admin",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = DateTime.UtcNow
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                SearchTerm = "Booking",
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal("Booking", result.Items.First().EntityName);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldFilterBySearchTerm_Description()
        {
            // Arrange
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    Description = "Created new user account",
                    DateCreated = DateTime.UtcNow
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Admin",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    Description = "Updated booking status",
                    DateCreated = DateTime.UtcNow
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                SearchTerm = "account",
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Contains("account", result.Items.First().Description!, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldOrderByDateDescending()
        {
            // Arrange
            var baseDate = DateTime.UtcNow;
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = baseDate.AddHours(-2)
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Admin",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = baseDate
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user3",
                    UserRole = "Admin",
                    Action = AuditAction.Delete,
                    EntityName = "Service",
                    DateCreated = baseDate.AddHours(-1)
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(3, result.TotalCount);
            var resultList = result.Items.ToList();
            Assert.True(resultList[0].DateCreated >= resultList[1].DateCreated);
            Assert.True(resultList[1].DateCreated >= resultList[2].DateCreated);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldApplyMultipleFilters()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var baseDate = DateTime.UtcNow.AddDays(-5);
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    UserName = "admin1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = baseDate.AddDays(2)
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "admin2",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = baseDate.AddDays(3)
                },
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    UserRole = "Admin",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = baseDate.AddDays(1)
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                UserId = userId,
                Action = AuditAction.Create,
                EntityName = "User",
                FromDate = baseDate,
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal(userId, result.Items.First().UserId);
            Assert.Equal(AuditAction.Create, result.Items.First().Action);
            Assert.Equal("User", result.Items.First().EntityName);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldReturnEmptyList_WhenNoMatches()
        {
            // Arrange
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = DateTime.UtcNow
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                UserRole = "Customer",
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(0, result.TotalCount);
            Assert.Empty(result.Items);
        }

        [Fact]
        public async Task GetAllAuditLogsAsync_ShouldMapDtoFieldsCorrectly()
        {
            // Arrange
            var logId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var entityId = Guid.NewGuid();
            var dateCreated = DateTime.UtcNow;
            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = logId,
                    UserId = userId,
                    UserName = "testuser",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    EntityId = entityId,
                    OldValue = "old",
                    NewValue = "new",
                    Description = "Test description",
                    DateCreated = dateCreated
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);

            var filter = new AuditLogFilterDto
            {
                PageNumber = 1,
                PageSize = 10
            };

            // Act
            var result = await _service.GetAllAuditLogsAsync(filter);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result.Items);
            var item = result.Items.First();
            Assert.Equal(logId, item.Id);
            Assert.Equal(userId, item.UserId);
            Assert.Equal("testuser", item.UserName);
            Assert.Equal("Admin", item.UserRole);
            Assert.Equal(AuditAction.Create, item.Action);
            Assert.Equal("User", item.EntityName);
            Assert.Equal(entityId, item.EntityId);
            Assert.Equal("old", item.OldValue);
            Assert.Equal("new", item.NewValue);
            Assert.Equal("Test description", item.Description);
            Assert.Equal(dateCreated, item.DateCreated);
        }

        // ============================================================
        // TEST: GetAuditLogByIdAsync
        // ============================================================

        [Fact]
        public async Task GetAuditLogByIdAsync_ShouldReturnLog_WhenExists()
        {
            // Arrange
            var logId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var entityId = Guid.NewGuid();
            var dateCreated = DateTime.UtcNow;
            var auditLog = new AuditLog
            {
                Id = logId,
                UserId = userId,
                UserName = "testuser",
                UserRole = "Admin",
                Action = AuditAction.Create,
                EntityName = "User",
                EntityId = entityId,
                OldValue = "old",
                NewValue = "new",
                Description = "Test description",
                DateCreated = dateCreated
            };

            _mockRepo.Setup(r => r.GetByIdAsync(logId)).ReturnsAsync(auditLog);

            // Act
            var result = await _service.GetAuditLogByIdAsync(logId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(logId, result.Id);
            Assert.Equal(userId, result.UserId);
            Assert.Equal("testuser", result.UserName);
            Assert.Equal("Admin", result.UserRole);
            Assert.Equal(AuditAction.Create, result.Action);
            Assert.Equal("User", result.EntityName);
            Assert.Equal(entityId, result.EntityId);
            Assert.Equal("old", result.OldValue);
            Assert.Equal("new", result.NewValue);
            Assert.Equal("Test description", result.Description);
            Assert.Equal(dateCreated, result.DateCreated);
        }

        [Fact]
        public async Task GetAuditLogByIdAsync_ShouldReturnNull_WhenNotExists()
        {
            // Arrange
            var logId = Guid.NewGuid();
            _mockRepo.Setup(r => r.GetByIdAsync(logId)).ReturnsAsync((AuditLog?)null);

            // Act
            var result = await _service.GetAuditLogByIdAsync(logId);

            // Assert
            Assert.Null(result);
        }

        // ============================================================
        // TEST: CreateAuditLogAsync
        // ============================================================

        [Fact]
        public async Task CreateAuditLogAsync_ShouldCreateLog_WhenInputIsValid()
        {
            // Arrange
            var input = new CreateAuditLogDto
            {
                UserId = Guid.NewGuid(),
                UserName = "testuser",
                UserRole = "Admin",
                Action = AuditAction.Create,
                EntityName = "User",
                EntityId = Guid.NewGuid(),
                OldValue = "old",
                NewValue = "new",
                Description = "Test description"
            };

            var expectedId = Guid.NewGuid();
            AuditLog? capturedLog = null;
            _mockRepo.Setup(r => r.AddAsync(It.IsAny<AuditLog>()))
                .Callback<AuditLog>(log =>
                {
                    capturedLog = log;
                    // Simulate database setting the Id
                    log.Id = expectedId;
                })
                .ReturnsAsync((AuditLog log) => log);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _service.CreateAuditLogAsync(input);

            // Assert
            Assert.Equal(expectedId, result);
            Assert.NotEqual(Guid.Empty, result);
            Assert.NotNull(capturedLog);
            Assert.Equal(input.UserId, capturedLog.UserId);
            Assert.Equal(input.UserName, capturedLog.UserName);
            Assert.Equal(input.UserRole, capturedLog.UserRole);
            Assert.Equal(input.Action, capturedLog.Action);
            Assert.Equal(input.EntityName, capturedLog.EntityName);
            Assert.Equal(input.EntityId, capturedLog.EntityId);
            Assert.Equal(input.OldValue, capturedLog.OldValue);
            Assert.Equal(input.NewValue, capturedLog.NewValue);
            Assert.Equal(input.Description, capturedLog.Description);
            Assert.True(capturedLog.DateCreated > DateTime.UtcNow.AddSeconds(-1));
            Assert.True(capturedLog.DateModified > DateTime.UtcNow.AddSeconds(-1));
            _mockRepo.Verify(r => r.AddAsync(It.IsAny<AuditLog>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

     
        [Fact]
        public async Task CreateAuditLogAsync_ShouldThrowArgumentNullException_WhenInputIsNull()
        {
            // Arrange
            _mockLocalizer.Setup(l => l["InputCannotBeNull"])
                .Returns(new LocalizedString("InputCannotBeNull", "Input cannot be null"));

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentNullException>(
                () => _service.CreateAuditLogAsync(null!));

            Assert.NotNull(exception);
            _mockRepo.Verify(r => r.AddAsync(It.IsAny<AuditLog>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task CreateAuditLogAsync_ShouldHandleNullOptionalFields()
        {
            // Arrange
            var input = new CreateAuditLogDto
            {
                UserId = Guid.NewGuid(),
                UserName = "testuser",
                UserRole = "Admin",
                Action = AuditAction.Create,
                EntityName = "User",
                EntityId = null,
                OldValue = null,
                NewValue = null,
                Description = null
            };

            var expectedId = Guid.NewGuid();
            AuditLog? capturedLog = null;
            _mockRepo.Setup(r => r.AddAsync(It.IsAny<AuditLog>()))
                .Callback<AuditLog>(log =>
                {
                    capturedLog = log;
                    // Simulate database setting the Id
                    log.Id = expectedId;
                })
                .ReturnsAsync((AuditLog log) => log);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _service.CreateAuditLogAsync(input);

            // Assert
            Assert.Equal(expectedId, result);
            Assert.NotEqual(Guid.Empty, result);
            Assert.NotNull(capturedLog);
            Assert.Null(capturedLog.EntityId);
            Assert.Null(capturedLog.OldValue);
            Assert.Null(capturedLog.NewValue);
            Assert.Null(capturedLog.Description);
        }

        // ============================================================
        // TEST: DeleteOldLogsAsync
        // ============================================================

        [Fact]
        public async Task DeleteOldLogsAsync_ShouldDeleteLogsOlderThanDaysToKeep()
        {
            // Arrange
            var daysToKeep = 30;
            var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);
            var oldLogId1 = Guid.NewGuid();
            var oldLogId2 = Guid.NewGuid();
            var recentLogId = Guid.NewGuid();

            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = oldLogId1,
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = cutoffDate.AddDays(-10)
                },
                new AuditLog
                {
                    Id = oldLogId2,
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Admin",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = cutoffDate.AddDays(-5)
                },
                new AuditLog
                {
                    Id = recentLogId,
                    UserId = Guid.NewGuid(),
                    UserName = "user3",
                    UserRole = "Admin",
                    Action = AuditAction.Delete,
                    EntityName = "Service",
                    DateCreated = cutoffDate.AddDays(5)
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);
            _mockRepo.Setup(r => r.DeleteAsync(oldLogId1)).Returns(Task.CompletedTask);
            _mockRepo.Setup(r => r.DeleteAsync(oldLogId2)).Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _service.DeleteOldLogsAsync(daysToKeep);

            // Assert
            Assert.True(result);
            _mockRepo.Verify(r => r.DeleteAsync(oldLogId1), Times.Once);
            _mockRepo.Verify(r => r.DeleteAsync(oldLogId2), Times.Once);
            _mockRepo.Verify(r => r.DeleteAsync(recentLogId), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task DeleteOldLogsAsync_ShouldNotDeleteLogs_WhenAllAreRecent()
        {
            // Arrange
            var daysToKeep = 30;
            var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);
            var recentLogId1 = Guid.NewGuid();
            var recentLogId2 = Guid.NewGuid();

            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = recentLogId1,
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = cutoffDate.AddDays(5)
                },
                new AuditLog
                {
                    Id = recentLogId2,
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Admin",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = cutoffDate.AddDays(10)
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _service.DeleteOldLogsAsync(daysToKeep);

            // Assert
            Assert.True(result);
            _mockRepo.Verify(r => r.DeleteAsync(It.IsAny<Guid>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task DeleteOldLogsAsync_ShouldDeleteAllLogs_WhenAllAreOld()
        {
            // Arrange
            var daysToKeep = 30;
            var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);
            var oldLogId1 = Guid.NewGuid();
            var oldLogId2 = Guid.NewGuid();

            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = oldLogId1,
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = cutoffDate.AddDays(-10)
                },
                new AuditLog
                {
                    Id = oldLogId2,
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Admin",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = cutoffDate.AddDays(-5)
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);
            _mockRepo.Setup(r => r.DeleteAsync(oldLogId1)).Returns(Task.CompletedTask);
            _mockRepo.Setup(r => r.DeleteAsync(oldLogId2)).Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _service.DeleteOldLogsAsync(daysToKeep);

            // Assert
            Assert.True(result);
            _mockRepo.Verify(r => r.DeleteAsync(oldLogId1), Times.Once);
            _mockRepo.Verify(r => r.DeleteAsync(oldLogId2), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task DeleteOldLogsAsync_ShouldReturnTrue_WhenNoLogsExist()
        {
            // Arrange
            var daysToKeep = 30;
            var logs = new List<AuditLog>();
            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _service.DeleteOldLogsAsync(daysToKeep);

            // Assert
            Assert.True(result);
            _mockRepo.Verify(r => r.DeleteAsync(It.IsAny<Guid>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task DeleteOldLogsAsync_ShouldUseCorrectCutoffDate()
        {
            // Arrange
            var daysToKeep = 7;
            var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);
            var oldLogId = Guid.NewGuid();
            var recentLogId = Guid.NewGuid();

            var logs = new List<AuditLog>
            {
                new AuditLog
                {
                    Id = oldLogId,
                    UserId = Guid.NewGuid(),
                    UserName = "user1",
                    UserRole = "Admin",
                    Action = AuditAction.Create,
                    EntityName = "User",
                    DateCreated = cutoffDate.AddDays(-1)
                },
                new AuditLog
                {
                    Id = recentLogId,
                    UserId = Guid.NewGuid(),
                    UserName = "user2",
                    UserRole = "Admin",
                    Action = AuditAction.Update,
                    EntityName = "Booking",
                    DateCreated = cutoffDate.AddDays(1)
                }
            };

            var logsMock = logs.BuildMock();
            _mockRepo.Setup(r => r.GetAll()).Returns(logsMock);
            _mockRepo.Setup(r => r.DeleteAsync(oldLogId)).Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _service.DeleteOldLogsAsync(daysToKeep);

            // Assert
            Assert.True(result);
            _mockRepo.Verify(r => r.DeleteAsync(oldLogId), Times.Once);
            _mockRepo.Verify(r => r.DeleteAsync(recentLogId), Times.Never);
        }
    }
}
