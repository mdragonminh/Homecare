using HSP.Core.Constans;
using HSP.Core.Constants;
using HSP.Core.Dtos.FileDto;
using HSP.Core.Dtos.ServiceRequestDto;
using HSP.Core.Dtos.TechnicianProfileDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Implementations.Internal;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Localization;
using MockQueryable;
using Moq;
using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;
using System.Reflection;

namespace HSP.Service.Test.Implementations.Internal
{
    public class TechnicianProfileServiceTests
    {
        private readonly Mock<IRepository<TechnicianProfile, Guid>> _mockRepo;
        private readonly Mock<IFileService> _mockFileService;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IRepository<Core.Entities.Service, Guid>> _mockServiceRepository;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;
        private readonly TechnicianProfileService _service;
        public TechnicianProfileServiceTests()
        {
            _mockRepo = new Mock<IRepository<TechnicianProfile, Guid>>();
            _mockFileService = new Mock<IFileService>();
            _mockEmailService = new Mock<IEmailService>();
            _mockServiceRepository = new Mock<IRepository<Core.Entities.Service, Guid>>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();

            _service = new TechnicianProfileService(
                _mockRepo.Object,
                _mockEmailService.Object,
                _mockFileService.Object,
                _mockServiceRepository.Object,
                _mockUnitOfWork.Object,
                _mockLocalizer.Object
            );
        }

        private async Task<bool> Invoke_UpdateLegalDocumentAsync(Guid technicianId, Guid userId, IFormFile file)
        {
            var method = typeof(TechnicianProfileService)
                .GetMethod("UpdateLegalDocumentAsync", BindingFlags.NonPublic | BindingFlags.Instance);

            return await (Task<bool>)method.Invoke(
                _service, new object[] { technicianId, userId, file }
            );
        }

        private async Task<bool> Invoke_UpdateCertificatesAsync(
    Guid technicianId, Guid userId, IEnumerable<IFormFile>? files)
        {
            var method = typeof(TechnicianProfileService)
                .GetMethod("UpdateCertificatesAsync", BindingFlags.NonPublic | BindingFlags.Instance);

            return await (Task<bool>)method.Invoke(_service, new object[] { technicianId, userId, files });
        }

        private IFormFile MockFormFile(string name, long size)
        {
            var file = new Mock<IFormFile>();
            file.Setup(f => f.FileName).Returns(name);
            file.Setup(f => f.Length).Returns(size);
            return file.Object;
        }


        private async Task<bool> Invoke_UpdateTechnicianServicesAsync(
    TechnicianProfile technician,
    List<TechnicianServiceDto>? newServices)
{
    var method = typeof(TechnicianProfileService)
        .GetMethod("UpdateTechnicianServicesAsync", BindingFlags.NonPublic | BindingFlags.Instance);

    return await (Task<bool>)method.Invoke(_service, new object[] { technician, newServices });
}




        [Fact]
        public async Task GetTechnicianByIdAsync_ShouldReturnTechnician()
        {
            // Arrange
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var technician = new TechnicianProfile
            {
                Id = technicianId,  // ✅ Sử dụng technicianId
                UserId = userId,
                ExperienceYears = 5,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                User = new AppUser
                {
                    UserName = "tech1",
                    Email = "tech1@test.com",
                    FullName = "Tech One",
                    PhoneNumber = "0123456789",
                    IsActive = true
                },
                Services = new List<Core.Entities.Service>  // ✅ Thêm Services
        {
            new Core.Entities.Service { Id = Guid.NewGuid(), Name = "Sửa điện" },
            new Core.Entities.Service { Id = Guid.NewGuid(), Name = "Sửa nước" }
        }
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            // ✅ Mock 3 lần gọi GetFilesAsync (Certificates, LegalDocument, Avatar)
            _mockFileService.Setup(f => f.GetFilesAsync(It.Is<GetFilesRequestDto>(
                req => req.relationType == FileConstants.TechnicianCertificate)))
                .ReturnsAsync(new List<FileDto>
                {
            new FileDto { Id = Guid.NewGuid(), FileName = "cert.pdf" }
                });

            _mockFileService.Setup(f => f.GetFilesAsync(It.Is<GetFilesRequestDto>(
                req => req.relationType == FileConstants.LegalDocument)))
                .ReturnsAsync(new List<FileDto>
                {
            new FileDto { Id = Guid.NewGuid(), FileName = "legal.pdf" }
                });

            _mockFileService.Setup(f => f.GetFilesAsync(It.Is<GetFilesRequestDto>(
                req => req.relationType == FileConstants.Avatar)))
                .ReturnsAsync(new List<FileDto>
                {
            new FileDto { Id = Guid.NewGuid(), FileName = "avatar.jpg" }
                });

            // Act
            var result = await _service.GetTechnicianByIdAsync(technicianId);  // ✅ Truyền technicianId

            // Assert
            Assert.NotNull(result);
            Assert.Equal(technicianId, result.Id);
            Assert.Equal(userId, result.UserId);
            Assert.Equal("Tech One", result.FullName);
            Assert.Equal("tech1@test.com", result.Email);
            Assert.Equal("0123456789", result.PhoneNumber);
            Assert.Equal(5, result.ExperienceYears);
            Assert.Equal(2, result.Services.Count);
            Assert.NotNull(result.CertificateFiles);
            Assert.NotNull(result.LegalDocument);
            Assert.NotNull(result.Avatar);

            // ✅ Verify GetFilesAsync được gọi 3 lần
            _mockFileService.Verify(f => f.GetFilesAsync(It.IsAny<GetFilesRequestDto>()), Times.Exactly(3));
        }


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

        [Fact]
        public async Task ApproveTechnicianAsync_TechnicianNotFound_ShouldThrowValidationException()
        {
            var technicianId = Guid.NewGuid();

            var emptyList = new List<TechnicianProfile>().BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(emptyList);

            var exception = await Assert.ThrowsAsync<ValidationException>(
                () => _service.ApproveTechnicianAsync(technicianId, "admin")
            );

            Assert.Equal("Technician profile not found.", exception.Message);

            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task ApproveTechnicianAsync_TechnicianAlreadyApproved_ShouldThrowValidationException()
        {
            // Arrange
            var technicianId = Guid.NewGuid();
            var technician = new TechnicianProfile
            {
                Id = technicianId,
                ApprovalStatus = TechnicianApprovalStatus.Approved, 
                ApprovedBy = "old_admin",
                ApprovedAt = DateTime.UtcNow.AddDays(-1)
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ValidationException>(
                () => _service.ApproveTechnicianAsync(technicianId, "admin")
            );

            Assert.Equal("Technician is already approved.", exception.Message);

            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);

            Assert.Equal(TechnicianApprovalStatus.Approved, technician.ApprovalStatus);
            Assert.Equal("old_admin", technician.ApprovedBy);
        }


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
        public async Task RejectTechnicianAsync_TechnicianNotFound_ShouldThrowValidationException()
        {
            var technicianId = Guid.NewGuid();

            var emptyList = new List<TechnicianProfile>().BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(emptyList);

            var exception = await Assert.ThrowsAsync<ValidationException>(
                () => _service.RejectTechnicianAsync(technicianId, "admin", "Invalid data")
            );

            Assert.Equal("Technician profile not found.", exception.Message);

            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task RejectTechnicianAsync_TechnicianAlreadyRejected_ShouldThrowValidationException()
        {
            var technicianId = Guid.NewGuid();
            var technician = new TechnicianProfile
            {
                Id = technicianId,
                ApprovalStatus = TechnicianApprovalStatus.Rejected, 
                RejectionReason = "Old reason"
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var exception = await Assert.ThrowsAsync<ValidationException>(
                () => _service.RejectTechnicianAsync(technicianId, "admin", "New reason")
            );

            Assert.Equal("Technician is already rejected.", exception.Message);

            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);

            Assert.Equal(TechnicianApprovalStatus.Rejected, technician.ApprovalStatus);
            Assert.Equal("Old reason", technician.RejectionReason); 
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

        [Fact]
        public async Task UpdateTechnicianProfileAsync_InputIsNull_ShouldThrowArgumentNullException()
        {
            _mockLocalizer.Setup(l => l["InputCannotBeNull"]).Returns(new LocalizedString("InputCannotBeNull", "Input cannot be null"));

            await Assert.ThrowsAsync<ArgumentNullException>(() =>
                _service.UpdateTechnicianProfileAsync(Guid.NewGuid(), null!)
            );
        }

        [Fact]
        public async Task UpdateTechnicianProfileAsync_TechnicianNotFound_ShouldThrowKeyNotFoundException()
        {
            var userId = Guid.NewGuid();

            var emptyListMock = new List<TechnicianProfile>().BuildMock();

            _mockRepo
                .Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                .Returns(emptyListMock);

            var dto = new UpdateTechnicianProfileDto();

            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.UpdateTechnicianProfileAsync(userId, dto)
            );

            Assert.Equal("Không tìm thấy kĩ thuật viên", exception.Message);
        }




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

        [Fact]
        public async Task GetTechnicianIdByUserId_ShouldReturnTechnicianId_WhenExists()
        {
            var userId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();

            var data = new List<TechnicianProfile>
    {
        new TechnicianProfile { Id = technicianId, UserId = userId }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll()).Returns(data);

            var result = await _service.GetTechnicianIdByUserId(userId);

            Assert.Equal(technicianId, result);
        }

        [Fact]
        public async Task GetTechnicianIdByUserId_ShouldThrow_WhenNotFound()
        {
            var userId = Guid.NewGuid();

            var data = new List<TechnicianProfile>().BuildMock(); 

            _mockRepo.Setup(r => r.GetAll()).Returns(data);

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.GetTechnicianIdByUserId(userId));

            Assert.Equal("Không tìm thấy kĩ thuật viên", ex.Message);
        }


        [Fact]
        public async Task UpdateLegalDocumentAsync_ShouldReturnFalse_WhenFilesAreSame()
        {
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var oldFile = new FileDto
            {
                Id = Guid.NewGuid(),
                FileName = "doc.pdf",
                FileSize = 500
            };

            var newFile = new Mock<IFormFile>();
            newFile.Setup(f => f.FileName).Returns("doc.pdf");
            newFile.Setup(f => f.Length).Returns(500);

            _mockFileService.Setup(f => f.GetFilesAsync(It.IsAny<GetFilesRequestDto>()))
                            .ReturnsAsync(new List<FileDto> { oldFile });

            var result = await Invoke_UpdateLegalDocumentAsync(technicianId, userId, newFile.Object);

            Assert.False(result);
            _mockFileService.Verify(f => f.DeleteAsync(It.IsAny<Guid>()), Times.Never);
            _mockFileService.Verify(f => f.UploadAsync(It.IsAny<FileUploadDto>()), Times.Never);
        }




        [Fact]
        public async Task UpdateLegalDocumentAsync_ShouldUpload_WhenFilesAreDifferent()
        {
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var oldFile = new FileDto
            {
                Id = Guid.NewGuid(),
                FileName = "doc.pdf",
                FileSize = 500
            };

            var newFile = new Mock<IFormFile>();
            newFile.Setup(f => f.FileName).Returns("new.pdf");
            newFile.Setup(f => f.Length).Returns(600);

            _mockFileService.Setup(f => f.GetFilesAsync(It.IsAny<GetFilesRequestDto>()))
                            .ReturnsAsync(new List<FileDto> { oldFile });

            var result = await Invoke_UpdateLegalDocumentAsync(technicianId, userId, newFile.Object);

            Assert.True(result);
            _mockFileService.Verify(f => f.DeleteAsync(oldFile.Id), Times.Once);
            _mockFileService.Verify(f => f.UploadAsync(It.IsAny<FileUploadDto>()), Times.Once);
        }

        [Fact]
        public async Task UpdateCertificatesAsync_ShouldReturnFalse_WhenNewFilesIsNull()
        {
            var result = await Invoke_UpdateCertificatesAsync(Guid.NewGuid(), Guid.NewGuid(), null);

            Assert.False(result);
            _mockFileService.Verify(x => x.GetFilesAsync(It.IsAny<GetFilesRequestDto>()), Times.Never);
        }

        [Fact]
        public async Task UpdateCertificatesAsync_ShouldReturnFalse_WhenNewFilesIsEmpty()
        {
            var result = await Invoke_UpdateCertificatesAsync(Guid.NewGuid(), Guid.NewGuid(), new List<IFormFile>());

            Assert.False(result);
            _mockFileService.Verify(x => x.GetFilesAsync(It.IsAny<GetFilesRequestDto>()), Times.Never);
        }

        [Fact]
        public async Task UpdateCertificatesAsync_ShouldUpdate_WhenCountIsDifferent()
        {
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var oldFile = new FileDto
            {
                Id = Guid.NewGuid(),
                FileName = "old.pdf",
                FileSize = 100
            };

            _mockFileService.Setup(x => x.GetFilesAsync(It.IsAny<GetFilesRequestDto>()))
                .ReturnsAsync(new List<FileDto> { oldFile });

            var newFiles = new List<IFormFile>
    {
        MockFormFile("a.pdf", 50),
        MockFormFile("b.pdf", 60)
    };

            var result = await Invoke_UpdateCertificatesAsync(technicianId, userId, newFiles);

            Assert.True(result);
            _mockFileService.Verify(x => x.DeleteAsync(oldFile.Id), Times.Once);
            _mockFileService.Verify(x => x.UploadManyAsync(It.IsAny<IEnumerable<FileUploadDto>>()), Times.Once);
        }

        [Fact]
        public async Task UpdateCertificatesAsync_ShouldUpdate_WhenFilesContentDifferent()
        {
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var oldFile = new FileDto
            {
                Id = Guid.NewGuid(),
                FileName = "old.pdf",
                FileSize = 100
            };

            _mockFileService.Setup(x => x.GetFilesAsync(It.IsAny<GetFilesRequestDto>()))
                .ReturnsAsync(new List<FileDto> { oldFile });

            var newFiles = new List<IFormFile>
    {
        MockFormFile("new.pdf", 100)
    };

            var result = await Invoke_UpdateCertificatesAsync(technicianId, userId, newFiles);

            Assert.True(result);
            _mockFileService.Verify(x => x.DeleteAsync(oldFile.Id), Times.Once);
            _mockFileService.Verify(x => x.UploadManyAsync(It.IsAny<IEnumerable<FileUploadDto>>()), Times.Once);
        }


        [Fact]
        public async Task UpdateCertificatesAsync_ShouldReturnFalse_WhenFilesAreIdentical()
        {
            var technicianId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var oldFile = new FileDto
            {
                Id = Guid.NewGuid(),
                FileName = "same.pdf",
                FileSize = 200
            };

            _mockFileService.Setup(x => x.GetFilesAsync(It.IsAny<GetFilesRequestDto>()))
                .ReturnsAsync(new List<FileDto> { oldFile });

            var newFiles = new List<IFormFile>
    {
        MockFormFile("same.pdf", 200)
    };

            var result = await Invoke_UpdateCertificatesAsync(technicianId, userId, newFiles);

            Assert.False(result);
            _mockFileService.Verify(x => x.DeleteAsync(It.IsAny<Guid>()), Times.Never);
            _mockFileService.Verify(x => x.UploadManyAsync(It.IsAny<IEnumerable<FileUploadDto>>()), Times.Never);
        }

        [Fact]
        public async Task UpdateTechnicianServicesAsync_ShouldReturnFalse_WhenNewServicesIsNull()
        {
            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                Services = new List<Core.Entities.Service>()
            };

            var result = await Invoke_UpdateTechnicianServicesAsync(technician, null);

            Assert.False(result);
            _mockServiceRepository.Verify(x => x.GetAll(), Times.Never);
        }

        [Fact]
        public async Task UpdateTechnicianServicesAsync_ShouldReturnFalse_WhenNewServicesIsEmpty()
        {
            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                Services = new List<Core.Entities.Service>()
            };

            var result = await Invoke_UpdateTechnicianServicesAsync(technician, new List<TechnicianServiceDto>());

            Assert.False(result);
            _mockServiceRepository.Verify(x => x.GetAll(), Times.Never);
        }

        [Fact]
        public async Task UpdateTechnicianServicesAsync_ShouldReturnFalse_WhenServicesAreIdentical()
        {
            var serviceId1 = Guid.NewGuid();
            var serviceId2 = Guid.NewGuid();

            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                Services = new List<Core.Entities.Service>
        {
            new Core.Entities.Service { Id = serviceId1, Name = "Service 1" },
            new Core.Entities.Service { Id = serviceId2, Name = "Service 2" }
        }
            };

            var newServices = new List<TechnicianServiceDto>
    {
        new TechnicianServiceDto { Id = serviceId1, Name = "Service 1" },
        new TechnicianServiceDto { Id = serviceId2, Name = "Service 2" }
    };

            // Act
            var result = await Invoke_UpdateTechnicianServicesAsync(technician, newServices);

            Assert.False(result);
            Assert.Equal(2, technician.Services.Count);
            _mockServiceRepository.Verify(x => x.GetAll(), Times.Never);
        }

        [Fact]
        public async Task UpdateTechnicianServicesAsync_ShouldReturnTrue_WhenCountIsDifferent()
        {
            var serviceId1 = Guid.NewGuid();
            var serviceId2 = Guid.NewGuid();
            var serviceId3 = Guid.NewGuid();

            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                Services = new List<Core.Entities.Service>
        {
            new Core.Entities.Service { Id = serviceId1, Name = "Service 1" }
        }
            };

            var newServices = new List<TechnicianServiceDto>
    {
        new TechnicianServiceDto { Id = serviceId1 },
        new TechnicianServiceDto { Id = serviceId2 },
        new TechnicianServiceDto { Id = serviceId3 }
    };

            var addedServices = new List<Core.Entities.Service>
    {
        new Core.Entities.Service { Id = serviceId2, Name = "Service 2" },
        new Core.Entities.Service { Id = serviceId3, Name = "Service 3" }
    }.BuildMock();

            _mockServiceRepository.Setup(x => x.GetAll())
                .Returns(addedServices);

            var result = await Invoke_UpdateTechnicianServicesAsync(technician, newServices);

            Assert.True(result);
            Assert.Equal(3, technician.Services.Count);
            Assert.Contains(technician.Services, s => s.Id == serviceId1);
            Assert.Contains(technician.Services, s => s.Id == serviceId2);
            Assert.Contains(technician.Services, s => s.Id == serviceId3);
        }


        [Fact]
        public async Task UpdateTechnicianServicesAsync_ShouldRemoveOldServices_WhenNotInNewList()
        {
            var serviceId1 = Guid.NewGuid();
            var serviceId2 = Guid.NewGuid();
            var serviceId3 = Guid.NewGuid();

            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                Services = new List<Core.Entities.Service>
        {
            new Core.Entities.Service { Id = serviceId1, Name = "Service 1" },
            new Core.Entities.Service { Id = serviceId2, Name = "Service 2" },
            new Core.Entities.Service { Id = serviceId3, Name = "Service 3" }
        }
            };

            var newServices = new List<TechnicianServiceDto>
    {
        new TechnicianServiceDto { Id = serviceId1 }
    };

            var result = await Invoke_UpdateTechnicianServicesAsync(technician, newServices);

            Assert.True(result);
            Assert.Single(technician.Services);
            Assert.Contains(technician.Services, s => s.Id == serviceId1);
            Assert.DoesNotContain(technician.Services, s => s.Id == serviceId2);
            Assert.DoesNotContain(technician.Services, s => s.Id == serviceId3);
        }

        [Fact]
        public async Task UpdateTechnicianServicesAsync_ShouldAddAndRemove_WhenServicesMixed()
        {
            var serviceId1 = Guid.NewGuid();
            var serviceId2 = Guid.NewGuid();
            var serviceId3 = Guid.NewGuid();
            var serviceId4 = Guid.NewGuid();

            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                Services = new List<Core.Entities.Service>
        {
            new Core.Entities.Service { Id = serviceId1, Name = "Service 1" },
            new Core.Entities.Service { Id = serviceId2, Name = "Service 2" }
        }
            };

            var newServices = new List<TechnicianServiceDto>
    {
        new TechnicianServiceDto { Id = serviceId1 }, 
        new TechnicianServiceDto { Id = serviceId3 }, 
        new TechnicianServiceDto { Id = serviceId4 } 
    };

            var addedServices = new List<Core.Entities.Service>
    {
        new Core.Entities.Service { Id = serviceId3, Name = "Service 3" },
        new Core.Entities.Service { Id = serviceId4, Name = "Service 4" }
    }.BuildMock();

            _mockServiceRepository.Setup(x => x.GetAll())
                .Returns(addedServices);

            // Act
            var result = await Invoke_UpdateTechnicianServicesAsync(technician, newServices);

            // Assert
            Assert.True(result);
            Assert.Equal(3, technician.Services.Count);
            Assert.Contains(technician.Services, s => s.Id == serviceId1); 
            Assert.Contains(technician.Services, s => s.Id == serviceId3); 
            Assert.Contains(technician.Services, s => s.Id == serviceId4); 
            Assert.DoesNotContain(technician.Services, s => s.Id == serviceId2); 
        }


        [Fact]
        public async Task UpdateTechnicianServicesAsync_ShouldReturnTrue_WhenServiceContentDifferent()
        {
            // Arrange
            var serviceId1 = Guid.NewGuid();
            var serviceId2 = Guid.NewGuid();
            var serviceId3 = Guid.NewGuid();

            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                Services = new List<Core.Entities.Service>
        {
            new Core.Entities.Service { Id = serviceId1, Name = "Service 1" },
            new Core.Entities.Service { Id = serviceId2, Name = "Service 2" }
        }
            };

            var newServices = new List<TechnicianServiceDto>
    {
        new TechnicianServiceDto { Id = serviceId1 },
        new TechnicianServiceDto { Id = serviceId3 } 
    };

            var addedServices = new List<Core.Entities.Service>
    {
        new Core.Entities.Service { Id = serviceId3, Name = "Service 3" }
    }.BuildMock();

            _mockServiceRepository.Setup(x => x.GetAll())
                .Returns(addedServices);

            var result = await Invoke_UpdateTechnicianServicesAsync(technician, newServices);

            Assert.True(result);
            Assert.Equal(2, technician.Services.Count);
            Assert.Contains(technician.Services, s => s.Id == serviceId1);
            Assert.Contains(technician.Services, s => s.Id == serviceId3);
            Assert.DoesNotContain(technician.Services, s => s.Id == serviceId2);
        }

        [Fact]
        public async Task RejectTechnicianWithNotificationAsync_ShouldCallEmailService()
        {
            var technicianId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = "tech1",
                Email = "tech1@test.com",
                FullName = "Tech One"
            };

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

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _service.RejectTechnicianWithNotificationAsync(technicianId, "admin", "Invalid documents");

            Assert.True(result);
            Assert.Equal(TechnicianApprovalStatus.Rejected, technician.ApprovalStatus);
            Assert.Equal("Invalid documents", technician.RejectionReason);

            _mockEmailService.Verify(e => e.SendEmailAsync(It.Is<EmailDto>(dto =>
                dto.ToEmail == "tech1@test.com" &&
                dto.Subject == "❌ Hồ sơ kỹ thuật viên chưa được duyệt - HomeService Platform"
            )), Times.Once);
        }

        [Fact]
        public async Task RejectTechnicianWithNotificationAsync_WhenNotFound_ShouldReturnFalse()
        {
            var technicianId = Guid.NewGuid();
            var technicians = new List<TechnicianProfile>().BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var result = await _service.RejectTechnicianWithNotificationAsync(technicianId, "admin", "Invalid documents");

            Assert.False(result);
            _mockEmailService.Verify(e => e.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task RejectTechnicianWithNotificationAsync_WhenEmailFails_ShouldStillReturnTrue()
        {
            // Arrange
            var technicianId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = "tech1",
                Email = "tech1@test.com",
                FullName = "Tech One"
            };

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

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            _mockEmailService.Setup(e => e.SendEmailAsync(It.IsAny<EmailDto>()))
                             .ThrowsAsync(new Exception("Email service unavailable"));

            var result = await _service.RejectTechnicianWithNotificationAsync(technicianId, "admin", "Invalid documents");

            Assert.True(result); 
            Assert.Equal(TechnicianApprovalStatus.Rejected, technician.ApprovalStatus);
            Assert.Equal("Invalid documents", technician.RejectionReason);

            _mockEmailService.Verify(e => e.SendEmailAsync(It.IsAny<EmailDto>()), Times.Once);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task RejectTechnicianWithNotificationAsync_WhenAlreadyRejected_ShouldNotSendEmail()
        {
            var technicianId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = "tech1",
                Email = "tech1@test.com",
                FullName = "Tech One"
            };

            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = user.Id,
                ApprovalStatus = TechnicianApprovalStatus.Rejected, 
                RejectionReason = "Old reason",
                User = user
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            await Assert.ThrowsAsync<ValidationException>(
                () => _service.RejectTechnicianWithNotificationAsync(technicianId, "admin", "New reason")
            );

            _mockEmailService.Verify(e => e.SendEmailAsync(It.IsAny<EmailDto>()), Times.Never);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task GetTechniciansAsync_ShouldReturnAllTechnicians_WhenNoFilter()
        {
            var user1 = new AppUser { Id = Guid.NewGuid(), UserName = "tech1", Email = "tech1@test.com", FullName = "Tech One", IsActive = true };
            var user2 = new AppUser { Id = Guid.NewGuid(), UserName = "tech2", Email = "tech2@test.com", FullName = "Tech Two", IsActive = true };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile
        {
            Id = Guid.NewGuid(),
            UserId = user1.Id,
            User = user1,
            ExperienceYears = 5,
            ApprovalStatus = TechnicianApprovalStatus.Approved,
            DateCreated = DateTime.UtcNow
        },
        new TechnicianProfile
        {
            Id = Guid.NewGuid(),
            UserId = user2.Id,
            User = user2,
            ExperienceYears = 3,
            ApprovalStatus = TechnicianApprovalStatus.Pending,
            DateCreated = DateTime.UtcNow
        }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
        }

        [Fact]
        public async Task GetTechniciansAsync_ShouldFilterBySearchTerm_Username()
        {
            var user1 = new AppUser { Id = Guid.NewGuid(), UserName = "john_tech", Email = "john@test.com", FullName = "John Doe", IsActive = true };
            var user2 = new AppUser { Id = Guid.NewGuid(), UserName = "jane_tech", Email = "jane@test.com", FullName = "Jane Smith", IsActive = true };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user1.Id, User = user1, ExperienceYears = 5, DateCreated = DateTime.UtcNow },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user2.Id, User = user2, ExperienceYears = 3, DateCreated = DateTime.UtcNow }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                SearchTerm = "john",
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal("john_tech", result.Items.First().UserName);
        }

        [Fact]
        public async Task GetTechniciansAsync_ShouldFilterBySearchTerm_Email()
        {
            var user1 = new AppUser { Id = Guid.NewGuid(), UserName = "tech1", Email = "admin@test.com", FullName = "Tech One", IsActive = true };
            var user2 = new AppUser { Id = Guid.NewGuid(), UserName = "tech2", Email = "user@test.com", FullName = "Tech Two", IsActive = true };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user1.Id, User = user1, ExperienceYears = 5, DateCreated = DateTime.UtcNow },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user2.Id, User = user2, ExperienceYears = 3, DateCreated = DateTime.UtcNow }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                SearchTerm = "admin",
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal("admin@test.com", result.Items.First().Email);
        }

        [Fact]
        public async Task GetTechniciansAsync_ShouldFilterBySearchTerm_FullName()
        {
            var user1 = new AppUser { Id = Guid.NewGuid(), UserName = "tech1", Email = "tech1@test.com", FullName = "Nguyen Van A", IsActive = true };
            var user2 = new AppUser { Id = Guid.NewGuid(), UserName = "tech2", Email = "tech2@test.com", FullName = "Tran Thi B", IsActive = true };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user1.Id, User = user1, ExperienceYears = 5, DateCreated = DateTime.UtcNow },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user2.Id, User = user2, ExperienceYears = 3, DateCreated = DateTime.UtcNow }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                SearchTerm = "nguyen",
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal("Nguyen Van A", result.Items.First().FullName);
        }

        [Fact]
        public async Task GetTechniciansAsync_ShouldFilterByApprovalStatus()
        {
            var user1 = new AppUser { Id = Guid.NewGuid(), UserName = "tech1", Email = "tech1@test.com", FullName = "Tech One", IsActive = true };
            var user2 = new AppUser { Id = Guid.NewGuid(), UserName = "tech2", Email = "tech2@test.com", FullName = "Tech Two", IsActive = true };
            var user3 = new AppUser { Id = Guid.NewGuid(), UserName = "tech3", Email = "tech3@test.com", FullName = "Tech Three", IsActive = true };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user1.Id, User = user1, ExperienceYears = 5, ApprovalStatus = TechnicianApprovalStatus.Approved, DateCreated = DateTime.UtcNow },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user2.Id, User = user2, ExperienceYears = 3, ApprovalStatus = TechnicianApprovalStatus.Pending, DateCreated = DateTime.UtcNow },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user3.Id, User = user3, ExperienceYears = 2, ApprovalStatus = TechnicianApprovalStatus.Rejected, DateCreated = DateTime.UtcNow }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            Assert.NotNull(result);
            Assert.Equal(1, result.TotalCount);
            Assert.Single(result.Items);
            Assert.Equal(TechnicianApprovalStatus.Approved, result.Items.First().ApprovalStatus);
        }

        [Fact]
        public async Task GetTechniciansAsync_ShouldFilterByMinExperienceYears()
        {
            var user1 = new AppUser { Id = Guid.NewGuid(), UserName = "tech1", Email = "tech1@test.com", FullName = "Tech One", IsActive = true };
            var user2 = new AppUser { Id = Guid.NewGuid(), UserName = "tech2", Email = "tech2@test.com", FullName = "Tech Two", IsActive = true };
            var user3 = new AppUser { Id = Guid.NewGuid(), UserName = "tech3", Email = "tech3@test.com", FullName = "Tech Three", IsActive = true };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user1.Id, User = user1, ExperienceYears = 2, DateCreated = DateTime.UtcNow },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user2.Id, User = user2, ExperienceYears = 5, DateCreated = DateTime.UtcNow },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user3.Id, User = user3, ExperienceYears = 8, DateCreated = DateTime.UtcNow }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                MinExperienceYears = 5,
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
            Assert.All(result.Items, item => Assert.True(item.ExperienceYears >= 5));
        }

        [Fact]
        public async Task GetTechniciansAsync_ShouldFilterByMaxExperienceYears()
        {
            var user1 = new AppUser { Id = Guid.NewGuid(), UserName = "tech1", Email = "tech1@test.com", FullName = "Tech One", IsActive = true };
            var user2 = new AppUser { Id = Guid.NewGuid(), UserName = "tech2", Email = "tech2@test.com", FullName = "Tech Two", IsActive = true };
            var user3 = new AppUser { Id = Guid.NewGuid(), UserName = "tech3", Email = "tech3@test.com", FullName = "Tech Three", IsActive = true };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user1.Id, User = user1, ExperienceYears = 2, DateCreated = DateTime.UtcNow },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user2.Id, User = user2, ExperienceYears = 5, DateCreated = DateTime.UtcNow },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user3.Id, User = user3, ExperienceYears = 8, DateCreated = DateTime.UtcNow }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                MaxExperienceYears = 5,
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
            Assert.All(result.Items, item => Assert.True(item.ExperienceYears <= 5));
        }

        [Fact]
        public async Task GetTechniciansAsync_ShouldFilterByExperienceYearsRange()
        {
            var user1 = new AppUser { Id = Guid.NewGuid(), UserName = "tech1", Email = "tech1@test.com", FullName = "Tech One", IsActive = true };
            var user2 = new AppUser { Id = Guid.NewGuid(), UserName = "tech2", Email = "tech2@test.com", FullName = "Tech Two", IsActive = true };
            var user3 = new AppUser { Id = Guid.NewGuid(), UserName = "tech3", Email = "tech3@test.com", FullName = "Tech Three", IsActive = true };
            var user4 = new AppUser { Id = Guid.NewGuid(), UserName = "tech4", Email = "tech4@test.com", FullName = "Tech Four", IsActive = true };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user1.Id, User = user1, ExperienceYears = 2, DateCreated = DateTime.UtcNow },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user2.Id, User = user2, ExperienceYears = 5, DateCreated = DateTime.UtcNow },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user3.Id, User = user3, ExperienceYears = 7, DateCreated = DateTime.UtcNow },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user4.Id, User = user4, ExperienceYears = 10, DateCreated = DateTime.UtcNow }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                MinExperienceYears = 3,
                MaxExperienceYears = 8,
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
            Assert.All(result.Items, item => Assert.True(item.ExperienceYears >= 3 && item.ExperienceYears <= 8));
        }

        [Fact]
        public async Task GetTechniciansAsync_ShouldFilterByCreatedFrom()
        {
            var baseDate = new DateTime(2024, 1, 1);
            var user1 = new AppUser { Id = Guid.NewGuid(), UserName = "tech1", Email = "tech1@test.com", FullName = "Tech One", IsActive = true };
            var user2 = new AppUser { Id = Guid.NewGuid(), UserName = "tech2", Email = "tech2@test.com", FullName = "Tech Two", IsActive = true };
            var user3 = new AppUser { Id = Guid.NewGuid(), UserName = "tech3", Email = "tech3@test.com", FullName = "Tech Three", IsActive = true };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user1.Id, User = user1, ExperienceYears = 5, DateCreated = baseDate.AddDays(-10) },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user2.Id, User = user2, ExperienceYears = 3, DateCreated = baseDate },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user3.Id, User = user3, ExperienceYears = 2, DateCreated = baseDate.AddDays(10) }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                CreatedFrom = baseDate,
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
            Assert.All(result.Items, item => Assert.True(item.DateCreated >= baseDate));
        }

        [Fact]
        public async Task GetTechniciansAsync_ShouldFilterByCreatedTo()
        {
            var baseDate = new DateTime(2024, 1, 1);
            var user1 = new AppUser { Id = Guid.NewGuid(), UserName = "tech1", Email = "tech1@test.com", FullName = "Tech One", IsActive = true };
            var user2 = new AppUser { Id = Guid.NewGuid(), UserName = "tech2", Email = "tech2@test.com", FullName = "Tech Two", IsActive = true };
            var user3 = new AppUser { Id = Guid.NewGuid(), UserName = "tech3", Email = "tech3@test.com", FullName = "Tech Three", IsActive = true };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user1.Id, User = user1, ExperienceYears = 5, DateCreated = baseDate.AddDays(-10) },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user2.Id, User = user2, ExperienceYears = 3, DateCreated = baseDate },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user3.Id, User = user3, ExperienceYears = 2, DateCreated = baseDate.AddDays(10) }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                CreatedTo = baseDate,
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
            Assert.All(result.Items, item => Assert.True(item.DateCreated <= baseDate));
        }

        [Fact]
        public async Task GetTechniciansAsync_ShouldFilterByCreatedDateRange()
        {
            var startDate = new DateTime(2024, 1, 1);
            var endDate = new DateTime(2024, 1, 31);
            var user1 = new AppUser { Id = Guid.NewGuid(), UserName = "tech1", Email = "tech1@test.com", FullName = "Tech One", IsActive = true };
            var user2 = new AppUser { Id = Guid.NewGuid(), UserName = "tech2", Email = "tech2@test.com", FullName = "Tech Two", IsActive = true };
            var user3 = new AppUser { Id = Guid.NewGuid(), UserName = "tech3", Email = "tech3@test.com", FullName = "Tech Three", IsActive = true };
            var user4 = new AppUser { Id = Guid.NewGuid(), UserName = "tech4", Email = "tech4@test.com", FullName = "Tech Four", IsActive = true };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user1.Id, User = user1, ExperienceYears = 5, DateCreated = new DateTime(2023, 12, 15) },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user2.Id, User = user2, ExperienceYears = 3, DateCreated = new DateTime(2024, 1, 15) },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user3.Id, User = user3, ExperienceYears = 2, DateCreated = new DateTime(2024, 1, 20) },
        new TechnicianProfile { Id = Guid.NewGuid(), UserId = user4.Id, User = user4, ExperienceYears = 4, DateCreated = new DateTime(2024, 2, 5) }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                CreatedFrom = startDate,
                CreatedTo = endDate,
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
            Assert.All(result.Items, item => Assert.True(item.DateCreated >= startDate && item.DateCreated <= endDate));
        }

        [Fact]
        public async Task GetTechniciansAsync_ShouldApplyMultipleFilters()
        {
            var baseDate = new DateTime(2024, 1, 1);
            var user1 = new AppUser { Id = Guid.NewGuid(), UserName = "john_tech", Email = "john@test.com", FullName = "John Doe", IsActive = true };
            var user2 = new AppUser { Id = Guid.NewGuid(), UserName = "jane_tech", Email = "jane@test.com", FullName = "Jane Smith", IsActive = true };
            var user3 = new AppUser { Id = Guid.NewGuid(), UserName = "bob_tech", Email = "bob@test.com", FullName = "Bob Johnson", IsActive = true };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile
        {
            Id = Guid.NewGuid(),
            UserId = user1.Id,
            User = user1,
            ExperienceYears = 5,
            ApprovalStatus = TechnicianApprovalStatus.Approved,
            DateCreated = baseDate.AddDays(5)
        },
        new TechnicianProfile
        {
            Id = Guid.NewGuid(),
            UserId = user2.Id,
            User = user2,
            ExperienceYears = 3,
            ApprovalStatus = TechnicianApprovalStatus.Approved,
            DateCreated = baseDate.AddDays(10)
        },
        new TechnicianProfile
        {
            Id = Guid.NewGuid(),
            UserId = user3.Id,
            User = user3,
            ExperienceYears = 7,
            ApprovalStatus = TechnicianApprovalStatus.Pending,
            DateCreated = baseDate.AddDays(3)
        }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                SearchTerm = "tech",
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                MinExperienceYears = 3,
                MaxExperienceYears = 6,
                CreatedFrom = baseDate,
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            Assert.NotNull(result);
            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
            Assert.All(result.Items, item =>
            {
                Assert.Equal(TechnicianApprovalStatus.Approved, item.ApprovalStatus);
                Assert.True(item.ExperienceYears >= 3 && item.ExperienceYears <= 6);
                Assert.True(item.DateCreated >= baseDate);
            });
        }

        [Fact]
        public async Task GetTechniciansAsync_ShouldReturnEmptyList_WhenNoMatch()
        {
            var user1 = new AppUser { Id = Guid.NewGuid(), UserName = "tech1", Email = "tech1@test.com", FullName = "Tech One", IsActive = true };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile
        {
            Id = Guid.NewGuid(),
            UserId = user1.Id,
            User = user1,
            ExperienceYears = 5,
            ApprovalStatus = TechnicianApprovalStatus.Approved,
            DateCreated = DateTime.UtcNow
        }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                SearchTerm = "nonexistent",
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            Assert.NotNull(result);
            Assert.Equal(0, result.TotalCount);
            Assert.Empty(result.Items);
        }


        [Fact]
        public async Task GetTechniciansAsync_ShouldMapDtoFieldsCorrectly()
        {
            var userId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();
            var dateCreated = DateTime.UtcNow.AddDays(-10);
            var dateModified = DateTime.UtcNow.AddDays(-5);
            var approvedAt = DateTime.UtcNow.AddDays(-3);

            var user = new AppUser
            {
                Id = userId,
                UserName = "john_tech",
                Email = "john@test.com",
                PhoneNumber = "0123456789",
                FullName = "John Doe",
                IsActive = true
            };

            var technicians = new List<TechnicianProfile>
    {
        new TechnicianProfile
        {
            Id = technicianId,
            UserId = userId,
            User = user,
            ExperienceYears = 5,
            ApprovalStatus = TechnicianApprovalStatus.Approved,
            ApprovedBy = "admin",
            ApprovedAt = approvedAt,
            DateCreated = dateCreated,
            DateModified = dateModified
        }
    }.BuildMock();

            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var filterParams = new TechnicianProfileFilterParams
            {
                PageNumber = 1,
                PageSize = 10
            };

            var result = await _service.GetTechniciansAsync(filterParams);

            Assert.NotNull(result);
            Assert.Single(result.Items);

            var item = result.Items.First();
            Assert.Equal(technicianId, item.Id);
            Assert.Equal(userId, item.UserId);
            Assert.Equal("john_tech", item.UserName);
            Assert.Equal("john@test.com", item.Email);
            Assert.Equal("0123456789", item.PhoneNumber);
            Assert.Equal("John Doe", item.FullName);
            Assert.Equal(5, item.ExperienceYears);
            Assert.Equal(TechnicianApprovalStatus.Approved, item.ApprovalStatus);
            Assert.True(item.IsActive);
            Assert.Equal("admin", item.ApprovedBy);
            Assert.Equal(approvedAt, item.ApprovedAt);
            Assert.Equal(dateCreated, item.DateCreated);
            Assert.Equal(dateModified, item.DateModified);
        }

        // ============================================================
        // TEST: GetFeaturedTechniciansAsync
        // ============================================================

        [Fact]
        public async Task GetFeaturedTechniciansAsync_ShouldReturnEmptyList_WhenNoApprovedTechnicians()
        {
            // Arrange
            var technicians = new List<TechnicianProfile>().BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            // Act
            var result = await _service.GetFeaturedTechniciansAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetFeaturedTechniciansAsync_ShouldReturnEmptyList_WhenNoTechniciansWithRatings()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Test User",
                IsActive = true
            };

            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                User = user,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Bookings = new List<Booking>()
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            // Act
            var result = await _service.GetFeaturedTechniciansAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        //[Fact]
        //public async Task GetFeaturedTechniciansAsync_ShouldFilterOutInactiveUsers()
        //{
        //    // Arrange
        //    var userId = Guid.NewGuid();
        //    var user = new AppUser
        //    {
        //        Id = userId,
        //        FullName = "Inactive User",
        //        IsActive = false
        //    };

        //    var technician = new TechnicianProfile
        //    {
        //        Id = Guid.NewGuid(),
        //        UserId = userId,
        //        User = user,
        //        ApprovalStatus = TechnicianApprovalStatus.Approved,
        //        Bookings = new List<Booking>
        //        {
        //            new Booking
        //            {
        //                Id = Guid.NewGuid(),
        //                Status = BookingStatus.Completed,
        //                Feedbacks = new List<BookingFeedback>
        //                {
        //                    new BookingFeedback
        //                    {
        //                        Id = Guid.NewGuid(),
        //                        Rating = 5,
        //                        Source = FeedbackSource.Customer
        //                    }
        //                }
        //            }
        //        }
        //    };

        //    var technicians = new List<TechnicianProfile> { technician }.BuildMock();
        //    _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
        //             .Returns(technicians);

        //    // Act
        //    var result = await _service.GetFeaturedTechniciansAsync();

        //    // Assert
        //    Assert.NotNull(result);
        //    Assert.Empty(result);
        //}

        [Fact]
        public async Task GetFeaturedTechniciansAsync_ShouldFilterOutNonApprovedTechnicians()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Pending User",
                IsActive = true
            };

            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                User = user,
                ApprovalStatus = TechnicianApprovalStatus.Pending,
                Bookings = new List<Booking>
                {
                    new Booking
                    {
                        Id = Guid.NewGuid(),
                        Status = BookingStatus.Completed,
                        Feedbacks = new List<BookingFeedback>
                        {
                            new BookingFeedback
                            {
                                Id = Guid.NewGuid(),
                                Rating = 5,
                                Source = FeedbackSource.Customer
                            }
                        }
                    }
                }
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            // Act
            var result = await _service.GetFeaturedTechniciansAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetFeaturedTechniciansAsync_ShouldReturnTechnicians_WithCustomerFeedbacksOnly()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Test Technician",
                IsActive = true
            };

            var technicianId = Guid.NewGuid();
            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                User = user,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<Core.Entities.Service>
                {
                    new Core.Entities.Service
                    {
                        Id = Guid.NewGuid(),
                        Name = "Sửa chữa điện"
                    }
                },
                Bookings = new List<Booking>
                {
                    new Booking
                    {
                        Id = Guid.NewGuid(),
                        Status = BookingStatus.Completed,
                        Feedbacks = new List<BookingFeedback>
                        {
                            new BookingFeedback
                            {
                                Id = Guid.NewGuid(),
                                Rating = 5,
                                Source = FeedbackSource.Customer
                            },
                            new BookingFeedback
                            {
                                Id = Guid.NewGuid(),
                                Rating = 4,
                                Source = FeedbackSource.Technician // Should be ignored
                            }
                        }
                    }
                }
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            _mockFileService.Setup(f => f.GetFilesAsync(It.IsAny<GetFilesRequestDto>()))
                .ReturnsAsync(new List<FileDto>());

            // Act
            var result = await _service.GetFeaturedTechniciansAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            var featured = result.First();
            Assert.Equal(technicianId, featured.Id);
            Assert.Equal("Test Technician", featured.FullName);
            Assert.Equal(5.0, featured.Rating);
            Assert.Equal(1, featured.RatingCount); // Only customer feedback counted
        }

        [Fact]
        public async Task GetFeaturedTechniciansAsync_ShouldCalculateAverageRating_Correctly()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Test Technician",
                IsActive = true
            };

            var technicianId = Guid.NewGuid();
            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                User = user,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<Core.Entities.Service>(),
                Bookings = new List<Booking>
                {
                    new Booking
                    {
                        Id = Guid.NewGuid(),
                        Status = BookingStatus.Completed,
                        Feedbacks = new List<BookingFeedback>
                        {
                            new BookingFeedback
                            {
                                Id = Guid.NewGuid(),
                                Rating = 5,
                                Source = FeedbackSource.Customer
                            },
                            new BookingFeedback
                            {
                                Id = Guid.NewGuid(),
                                Rating = 4,
                                Source = FeedbackSource.Customer
                            },
                            new BookingFeedback
                            {
                                Id = Guid.NewGuid(),
                                Rating = 3,
                                Source = FeedbackSource.Customer
                            }
                        }
                    }
                }
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            _mockFileService.Setup(f => f.GetFilesAsync(It.IsAny<GetFilesRequestDto>()))
                .ReturnsAsync(new List<FileDto>());

            // Act
            var result = await _service.GetFeaturedTechniciansAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            var featured = result.First();
            Assert.Equal(4.0, featured.Rating); // (5+4+3)/3 = 4.0
            Assert.Equal(3, featured.RatingCount);
        }

        [Fact]
        public async Task GetFeaturedTechniciansAsync_ShouldOrderByRating_ThenRatingCount_ThenCompletedBookings()
        {
            // Arrange
            var userId1 = Guid.NewGuid();
            var user1 = new AppUser
            {
                Id = userId1,
                FullName = "Technician 1",
                IsActive = true
            };

            var userId2 = Guid.NewGuid();
            var user2 = new AppUser
            {
                Id = userId2,
                FullName = "Technician 2",
                IsActive = true
            };

            var userId3 = Guid.NewGuid();
            var user3 = new AppUser
            {
                Id = userId3,
                FullName = "Technician 3",
                IsActive = true
            };

            // Technician 1: Rating 5.0, 2 ratings, 3 completed bookings
            var technician1 = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId1,
                User = user1,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<Core.Entities.Service>(),
                Bookings = new List<Booking>
                {
                    new Booking
                    {
                        Id = Guid.NewGuid(),
                        Status = BookingStatus.Completed,
                        Feedbacks = new List<BookingFeedback>
                        {
                            new BookingFeedback { Id = Guid.NewGuid(), Rating = 5, Source = FeedbackSource.Customer },
                            new BookingFeedback { Id = Guid.NewGuid(), Rating = 5, Source = FeedbackSource.Customer }
                        }
                    },
                    new Booking { Id = Guid.NewGuid(), Status = BookingStatus.Completed, Feedbacks = new List<BookingFeedback>() },
                    new Booking { Id = Guid.NewGuid(), Status = BookingStatus.Completed, Feedbacks = new List<BookingFeedback>() }
                }
            };

            // Technician 2: Rating 5.0, 1 rating, 1 completed booking (lower rating count)
            var technician2 = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId2,
                User = user2,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<Core.Entities.Service>(),
                Bookings = new List<Booking>
                {
                    new Booking
                    {
                        Id = Guid.NewGuid(),
                        Status = BookingStatus.Completed,
                        Feedbacks = new List<BookingFeedback>
                        {
                            new BookingFeedback { Id = Guid.NewGuid(), Rating = 5, Source = FeedbackSource.Customer }
                        }
                    }
                }
            };

            // Technician 3: Rating 4.0, 2 ratings, 2 completed bookings (lower rating)
            var technician3 = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId3,
                User = user3,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<Core.Entities.Service>(),
                Bookings = new List<Booking>
                {
                    new Booking
                    {
                        Id = Guid.NewGuid(),
                        Status = BookingStatus.Completed,
                        Feedbacks = new List<BookingFeedback>
                        {
                            new BookingFeedback { Id = Guid.NewGuid(), Rating = 4, Source = FeedbackSource.Customer },
                            new BookingFeedback { Id = Guid.NewGuid(), Rating = 4, Source = FeedbackSource.Customer }
                        }
                    },
                    new Booking { Id = Guid.NewGuid(), Status = BookingStatus.Completed, Feedbacks = new List<BookingFeedback>() }
                }
            };

            var technicians = new List<TechnicianProfile> { technician1, technician2, technician3 }.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            _mockFileService.Setup(f => f.GetFilesAsync(It.IsAny<GetFilesRequestDto>()))
                .ReturnsAsync(new List<FileDto>());

            // Act
            var result = await _service.GetFeaturedTechniciansAsync(3);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(3, result.Count());
            
            // Should be ordered: Technician1 (5.0, 2 ratings, 3 bookings) > Technician2 (5.0, 1 rating) > Technician3 (4.0)
            var resultList = result.ToList();
            Assert.Equal("Technician 1", resultList[0].FullName);
            Assert.Equal("Technician 2", resultList[1].FullName);
            Assert.Equal("Technician 3", resultList[2].FullName);
        }

        [Fact]
        public async Task GetFeaturedTechniciansAsync_ShouldRespectCountParameter()
        {
            // Arrange
            var technicians = new List<TechnicianProfile>();
            for (int i = 0; i < 10; i++)
            {
                var userId = Guid.NewGuid();
                var user = new AppUser
                {
                    Id = userId,
                    FullName = $"Technician {i}",
                    IsActive = true
                };

                var technician = new TechnicianProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    User = user,
                    ApprovalStatus = TechnicianApprovalStatus.Approved,
                    Services = new List<Core.Entities.Service>(),
                    Bookings = new List<Booking>
                    {
                        new Booking
                        {
                            Id = Guid.NewGuid(),
                            Status = BookingStatus.Completed,
                            Feedbacks = new List<BookingFeedback>
                            {
                                new BookingFeedback
                                {
                                    Id = Guid.NewGuid(),
                                    Rating = 5,
                                    Source = FeedbackSource.Customer
                                }
                            }
                        }
                    }
                };
                technicians.Add(technician);
            }

            var techniciansMock = technicians.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(techniciansMock);

            _mockFileService.Setup(f => f.GetFilesAsync(It.IsAny<GetFilesRequestDto>()))
                .ReturnsAsync(new List<FileDto>());

            // Act
            var result = await _service.GetFeaturedTechniciansAsync(4);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(4, result.Count());
        }

        [Fact]
        public async Task GetFeaturedTechniciansAsync_ShouldIncludeAvatarUrl_WhenAvailable()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Test Technician",
                IsActive = true
            };

            var technicianId = Guid.NewGuid();
            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                User = user,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<Core.Entities.Service>(),
                Bookings = new List<Booking>
                {
                    new Booking
                    {
                        Id = Guid.NewGuid(),
                        Status = BookingStatus.Completed,
                        Feedbacks = new List<BookingFeedback>
                        {
                            new BookingFeedback
                            {
                                Id = Guid.NewGuid(),
                                Rating = 5,
                                Source = FeedbackSource.Customer
                            }
                        }
                    }
                }
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            var avatarFile = new FileDto
            {
                Id = Guid.NewGuid(),
                FilePath = "/uploads/avatar.jpg",
                FileName = "avatar.jpg"
            };

            _mockFileService.Setup(f => f.GetFilesAsync(It.Is<GetFilesRequestDto>(
                req => req.objectId == technicianId &&
                       req.objectTypeName == HSP.Core.Constans.RoleNames.Technician &&
                       req.relationType == FileConstants.Avatar)))
                .ReturnsAsync(new List<FileDto> { avatarFile });

            // Act
            var result = await _service.GetFeaturedTechniciansAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            var featured = result.First();
            Assert.Equal("/uploads/avatar.jpg", featured.AvatarUrl);
        }

        [Fact]
        public async Task GetFeaturedTechniciansAsync_ShouldHandleAvatarNotFound_Gracefully()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Test Technician",
                IsActive = true
            };

            var technicianId = Guid.NewGuid();
            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                User = user,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<Core.Entities.Service>(),
                Bookings = new List<Booking>
                {
                    new Booking
                    {
                        Id = Guid.NewGuid(),
                        Status = BookingStatus.Completed,
                        Feedbacks = new List<BookingFeedback>
                        {
                            new BookingFeedback
                            {
                                Id = Guid.NewGuid(),
                                Rating = 5,
                                Source = FeedbackSource.Customer
                            }
                        }
                    }
                }
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            _mockFileService.Setup(f => f.GetFilesAsync(It.IsAny<GetFilesRequestDto>()))
                .ThrowsAsync(new Exception("File not found"));

            // Act
            var result = await _service.GetFeaturedTechniciansAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            var featured = result.First();
            Assert.Null(featured.AvatarUrl);
        }

        [Fact]
        public async Task GetFeaturedTechniciansAsync_ShouldIncludeServices()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new AppUser
            {
                Id = userId,
                FullName = "Test Technician",
                IsActive = true
            };

            var technicianId = Guid.NewGuid();
            var service1 = new Core.Entities.Service
            {
                Id = Guid.NewGuid(),
                Name = "Sửa chữa điện"
            };
            var service2 = new Core.Entities.Service
            {
                Id = Guid.NewGuid(),
                Name = "Sửa chữa nước"
            };

            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                User = user,
                ApprovalStatus = TechnicianApprovalStatus.Approved,
                Services = new List<Core.Entities.Service> { service1, service2 },
                Bookings = new List<Booking>
                {
                    new Booking
                    {
                        Id = Guid.NewGuid(),
                        Status = BookingStatus.Completed,
                        Feedbacks = new List<BookingFeedback>
                        {
                            new BookingFeedback
                            {
                                Id = Guid.NewGuid(),
                                Rating = 5,
                                Source = FeedbackSource.Customer
                            }
                        }
                    }
                }
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            _mockFileService.Setup(f => f.GetFilesAsync(It.IsAny<GetFilesRequestDto>()))
                .ReturnsAsync(new List<FileDto>());

            // Act
            var result = await _service.GetFeaturedTechniciansAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            var featured = result.First();
            Assert.Equal(2, featured.Services.Count);
            Assert.Contains("Sửa chữa điện", featured.Services);
            Assert.Contains("Sửa chữa nước", featured.Services);
        }

        // ============================================================
        // TEST: ResendTechnicianApplication
        // ============================================================

        [Fact]
        public async Task ResendTechnicianApplication_ShouldThrowKeyNotFoundException_WhenProfileNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var technicians = new List<TechnicianProfile>().BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.ResendTechnicianApplication(userId));

            Assert.Contains("Không tìm thấy hồ sơ người gửi", exception.Message);
        }

        [Fact]
        public async Task ResendTechnicianApplication_ShouldThrowException_WhenStatusIsNotRejected()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ApprovalStatus = TechnicianApprovalStatus.Pending
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<Exception>(
                () => _service.ResendTechnicianApplication(userId));

            Assert.Contains("Không thể gửi duyệt ở trạng thái hiện tại", exception.Message);
        }

        [Fact]
        public async Task ResendTechnicianApplication_ShouldThrowException_WhenStatusIsApproved()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ApprovalStatus = TechnicianApprovalStatus.Approved
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<Exception>(
                () => _service.ResendTechnicianApplication(userId));

            Assert.Contains("Không thể gửi duyệt ở trạng thái hiện tại", exception.Message);
        }

        [Fact]
        public async Task ResendTechnicianApplication_ShouldUpdateStatusToPending_WhenStatusIsRejected()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();
            var originalDateModified = DateTime.UtcNow.AddDays(-1);
            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                ApprovalStatus = TechnicianApprovalStatus.Rejected,
                DateModified = originalDateModified
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _service.ResendTechnicianApplication(userId);

            // Assert
            Assert.True(result);
            Assert.Equal(TechnicianApprovalStatus.Pending, technician.ApprovalStatus);
            Assert.True(technician.DateModified > originalDateModified);
            _mockUnitOfWork.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task ResendTechnicianApplication_ShouldUpdateDateModified()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var technicianId = Guid.NewGuid();
            var originalDateModified = DateTime.UtcNow.AddDays(-5);
            var technician = new TechnicianProfile
            {
                Id = technicianId,
                UserId = userId,
                ApprovalStatus = TechnicianApprovalStatus.Rejected,
                DateModified = originalDateModified
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var beforeUpdate = technician.DateModified;
            await _service.ResendTechnicianApplication(userId);
            var afterUpdate = technician.DateModified;

            // Assert
            Assert.True(afterUpdate > beforeUpdate);
            Assert.True(afterUpdate >= DateTime.UtcNow.AddSeconds(-1)); // Allow small time difference
        }

        [Fact]
        public async Task ResendTechnicianApplication_ShouldReturnTrue_WhenSuccessful()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var technician = new TechnicianProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ApprovalStatus = TechnicianApprovalStatus.Rejected
            };

            var technicians = new List<TechnicianProfile> { technician }.BuildMock();
            _mockRepo.Setup(r => r.GetAll(It.IsAny<Expression<Func<TechnicianProfile, object>>[]>()))
                     .Returns(technicians);

            _mockUnitOfWork.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _service.ResendTechnicianApplication(userId);

            // Assert
            Assert.True(result);
        }

            

    }
}