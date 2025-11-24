using HSP.Core.Dtos.FileDto;
using HSP.Core.Dtos.TechnicianProfileDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Implementations.Internal;
using HSP.Service.Interfaces;
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
    public class TechnicianProfileServiceTests
    {
        private readonly Mock<IRepository<TechnicianProfile, Guid>> _mockRepo;
        private readonly Mock<IFileService> _mockFileService;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;
        private readonly TechnicianProfileService _service;

        public TechnicianProfileServiceTests()
        {
            _mockRepo = new Mock<IRepository<TechnicianProfile, Guid>>();
            _mockFileService = new Mock<IFileService>();
            _mockEmailService = new Mock<IEmailService>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();

            _service = new TechnicianProfileService(
                _mockRepo.Object,
                _mockEmailService.Object,
                _mockFileService.Object,
                _mockUnitOfWork.Object,
                _mockLocalizer.Object
            );
        }

        // ==================== GetTechnicianByIdAsync Tests ====================

        [Fact]
        public async Task GetTechnicianByIdAsync_ShouldReturnTechnician()
        {
            var userId = Guid.NewGuid();
            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ExperienceYears = 5,
                User = new AppUser { UserName = "tech1", Email = "tech1@test.com", FullName = "Tech One" }
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            _mockFileService.Setup(f => f.GetFilesAsync(It.IsAny<GetFilesRequestDto>()))
                            .ReturnsAsync(new List<FileDto>());

            var result = await _service.GetTechnicianByIdAsync(userId);

            Assert.NotNull(result);
            Assert.Equal(technician.UserId, result.UserId);
            Assert.Equal("Tech One", result.FullName);
        }

        


        // ==================== ApproveTechnicianAsync Tests ====================

        [Fact]
        public async Task ApproveTechnicianAsync_ShouldSetApprovedStatus()
        {
            var technicianId = Guid.NewGuid();
            var technician = new TechnicianProfile
            {
                Id = technicianId,
                ApprovalStatus = TechnicianApprovalStatus.Pending
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _service.ApproveTechnicianAsync(technicianId, "admin");

            Assert.True(result);
            Assert.Equal(TechnicianApprovalStatus.Approved, technician.ApprovalStatus);
            Assert.Equal("admin", technician.ApprovedBy);
            Assert.NotNull(technician.ApprovedAt);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }


        // ==================== RejectTechnicianAsync Tests ====================

        // ==================== RejectTechnicianAsync Tests ====================

        [Fact]
        public async Task RejectTechnicianAsync_ShouldSetRejectedStatus()
        {
            var technicianId = Guid.NewGuid();
            var technician = new TechnicianProfile
            {
                Id = technicianId,
                ApprovalStatus = TechnicianApprovalStatus.Pending
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var result = await _service.RejectTechnicianAsync(technicianId, "admin", "Invalid data");

            Assert.True(result);
            Assert.Equal(TechnicianApprovalStatus.Rejected, technician.ApprovalStatus);
            Assert.Equal("Invalid data", technician.RejectionReason);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

       
        [Fact]
        public async Task UpdateTechnicianProfileAsync_ShouldUpdateFields()
        {
            var userId = Guid.NewGuid();
            var technician = new TechnicianProfile
            {
                UserId = userId,
                CitizenId = "123",
                Address = "Old Address",
                ExperienceYears = 2
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var updateDto = new UpdateTechnicianProfileDto
            {
                CitizenId = "456",
                Address = "New Address",
                ExperienceYears = 5
            };

            var result = await _service.UpdateTechnicianProfileAsync(userId, updateDto);

            Assert.True(result);
            Assert.Equal("456", technician.CitizenId);
            Assert.Equal("New Address", technician.Address);
            Assert.Equal(5, technician.ExperienceYears);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        
        // ==================== ApproveTechnicianWithNotificationAsync Tests ====================

        [Fact]
        public async Task ApproveTechnicianWithNotificationAsync_ShouldCallEmailService()
        {
            var technicianId = Guid.NewGuid();
            var user = new AppUser { UserName = "tech1", Email = "tech1@test.com", FullName = "Tech One" };
            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = user.Id,
                ApprovalStatus = TechnicianApprovalStatus.Pending,
                User = user
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var result = await _service.ApproveTechnicianWithNotificationAsync(technicianId, "admin");

            Assert.True(result);
            _mockEmailService.Verify(e => e.SendEmailAsync(It.Is<EmailDto>(dto => dto.ToEmail == "tech1@test.com")), Times.Once);
        }

        [Fact]
        public async Task ApproveTechnicianWithNotificationAsync_WhenNotFound_ShouldReturnFalse()
        {
            var technicianId = Guid.NewGuid();
            var technicians = new List<TechnicianProfile>().BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var result = await _service.ApproveTechnicianWithNotificationAsync(technicianId, "admin");

            Assert.False(result);
            _mockEmailService.Verify(e => e.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
        }



        //[Fact]
        //public async Task RejectTechnicianWithNotificationAsync_ShouldRejectAndSendEmail()
        //{
        //    // Arrange
        //    var technicianId = Guid.NewGuid();
        //    var user = new AppUser { Id = Guid.NewGuid(), FullName = "Tech One", Email = "tech1@test.com" };
        //    var technician = new TechnicianProfile
        //    {
        //        Id = technicianId,
        //        UserId = user.Id,
        //        ApprovalStatus = TechnicianApprovalStatus.Pending,
        //        User = user
        //    };

        //    // Mock GetByIdAsync trực tiếp
        //    _mockRepo.Setup(r => r.GetByIdAsync(technicianId))
        //             .ReturnsAsync(technician);

        //    // Mock SaveChangesAsync cho UnitOfWork
        //    _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        //    // Mock email service
        //    _mockEmailService.Setup(e => e.SendEmailAsync(It.IsAny<EmailDto>()))
        //                     .Returns(Task.CompletedTask);

        //    // Act
        //    var result = await _service.RejectTechnicianWithNotificationAsync(technicianId, "admin", "Invalid data");

        //    // Assert
        //    Assert.True(result);
        //    Assert.Equal(TechnicianApprovalStatus.Rejected, technician.ApprovalStatus);
        //    Assert.Equal("Invalid data", technician.RejectionReason);

        //    _mockEmailService.Verify(e => e.SendEmailAsync(It.Is<EmailDto>(dto =>
        //        dto.ToEmail == "tech1@test.com" &&
        //        dto.Subject.Contains("❌") &&
        //        dto.HtmlBody.Contains("Tech One")
        //    )), Times.Once);

        //    _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        //}


        //[Fact]
        //public async Task RejectTechnicianWithNotificationAsync_WhenTechnicianNotFound_ShouldReturnFalse()
        //{
        //    // Arrange
        //    var technicianId = Guid.NewGuid();
        //    _mockRepo.Setup(r => r.GetByIdAsync(technicianId)).ReturnsAsync((TechnicianProfile?)null);

        //    // Act
        //    var result = await _service.RejectTechnicianWithNotificationAsync(technicianId, "admin", "Invalid data");

        //    // Assert
        //    Assert.False(result);
        //    _mockEmailService.Verify(e => e.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
        //}

        //[Fact]
        //public async Task RejectTechnicianWithNotificationAsync_WhenEmailServiceThrows_ShouldNotFail()
        //{
        //    // Arrange
        //    var technicianId = Guid.NewGuid();
        //    var user = new AppUser { Id = Guid.NewGuid(), FullName = "Tech One", Email = "tech1@test.com" };
        //    var technician = new TechnicianProfile
        //    {
        //        Id = technicianId,
        //        UserId = user.Id,
        //        ApprovalStatus = TechnicianApprovalStatus.Pending,
        //        User = user
        //    };

        //    _mockRepo.Setup(r => r.GetByIdAsync(technicianId))
        //             .ReturnsAsync(technician);

        //    _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
        //    _mockEmailService.Setup(e => e.SendEmailAsync(It.IsAny<EmailDto>()))
        //                     .ThrowsAsync(new Exception("SMTP error"));

        //    // Act
        //    var result = await _service.RejectTechnicianWithNotificationAsync(technicianId, "admin", "Invalid data");

        //    // Assert
        //    Assert.True(result);
        //    Assert.Equal(TechnicianApprovalStatus.Rejected, technician.ApprovalStatus);
        //    Assert.Equal("Invalid data", technician.RejectionReason);
        //    _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        //    // Email được gọi, nhưng exception không làm test fail
        //    _mockEmailService.Verify(e => e.SendEmailAsync(It.IsAny<EmailDto>()), Times.Once);
        //}











    }
}