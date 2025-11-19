using HSP.Core.Constants;
using HSP.Core.Dtos.FileDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations.Internal;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Localization;
using MockQueryable;
using MockQueryable.Moq;
using Moq;

namespace HSP.Service.Test.Implementations.Internal
{
    public class FileServiceTests
    {
        private readonly Mock<IRepository<Core.Entities.File, Guid>> _mockFileRepo;
        private readonly Mock<IRepository<FileRelation, Guid>> _mockFileRelationRepo;
        private readonly Mock<IRepository<ObjectType, Guid>> _mockObjectTypeRepo;
        private readonly Mock<IWebHostEnvironment> _mockEnv;
        private readonly Mock<IUnitOfWork> _mockUow;
        private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;
        private readonly FileService _service;

        public FileServiceTests()
        {
            _mockFileRepo = new Mock<IRepository<Core.Entities.File, Guid>>();
            _mockFileRelationRepo = new Mock<IRepository<FileRelation, Guid>>();
            _mockObjectTypeRepo = new Mock<IRepository<ObjectType, Guid>>();
            _mockEnv = new Mock<IWebHostEnvironment>();
            _mockUow = new Mock<IUnitOfWork>();
            _mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();

            _mockEnv.Setup(e => e.WebRootPath).Returns(Path.GetTempPath());

            _service = new FileService(
                    _mockFileRepo.Object,
                    _mockFileRelationRepo.Object,
                    _mockObjectTypeRepo.Object,
                    _mockEnv.Object,
                    _mockUow.Object,
                    _mockLocalizer.Object
            );
        }
        [Fact]
        public async Task UploadAsync_ValidInput_ShouldSaveFileAndReturnDto()
        {
            var formFileMock = new Mock<IFormFile>();
            var content = new MemoryStream(new byte[100]);
            formFileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default)).Returns(Task.CompletedTask);
            formFileMock.Setup(f => f.FileName).Returns("test.jpg");
            formFileMock.Setup(f => f.ContentType).Returns("image/jpeg");
            formFileMock.Setup(f => f.Length).Returns(100);

            var objectType = new ObjectType { Id = Guid.NewGuid(), Name = "Technician" };
            _mockObjectTypeRepo.Setup(r => r.GetAll())
                    .Returns(new List<ObjectType> { objectType }.BuildMock());

            var input = new FileUploadDto
            {
                File = formFileMock.Object,
                ObjectTypeName = "Technician",
                ObjectId = Guid.NewGuid(),
                RelationType = "Profile",
                UserId = Guid.NewGuid()
            };

            var result = await _service.UploadAsync(input);

            Assert.NotNull(result);
            Assert.Equal("test.jpg", result.FileName);
            _mockFileRepo.Verify(r => r.AddAsync(It.IsAny<Core.Entities.File>()), Times.Once);
            _mockFileRelationRepo.Verify(r => r.AddAsync(It.IsAny<FileRelation>()), Times.Once);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
        [Fact]
        public async Task UploadAsync_SaveChangesFails_ShouldDeletePhysicalFileAndThrow()
        {
            var formFileMock = new Mock<IFormFile>();
            formFileMock.Setup(f => f.FileName).Returns("test.jpg");
            formFileMock.Setup(f => f.ContentType).Returns("image/jpeg");
            formFileMock.Setup(f => f.Length).Returns(100);
            formFileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default))
                .ThrowsAsync(new Exception("write failed"));

            var objectType = new ObjectType { Id = Guid.NewGuid(), Name = "Technician" };
            _mockObjectTypeRepo.Setup(r => r.GetAll())
                .Returns(new List<ObjectType> { objectType }.BuildMock());

            var input = new FileUploadDto
            {
                File = formFileMock.Object,
                ObjectTypeName = "Technician",
                ObjectId = Guid.NewGuid()
            };

            await Assert.ThrowsAsync<Exception>(() => _service.UploadAsync(input));
        }
        [Fact]
        public async Task UploadAsync_NullFile_ThrowsArgumentException()
        {
            var input = new FileUploadDto { File = null };

            await Assert.ThrowsAsync<ArgumentException>(() => _service.UploadAsync(input));
        }
        [Fact]
        public async Task UploadAsync_UnsupportedExtension_ThrowsInvalidOperationException()
        {
            var formFileMock = new Mock<IFormFile>();
            formFileMock.Setup(f => f.FileName).Returns("test.exe");
            formFileMock.Setup(f => f.Length).Returns(100);

            var input = new FileUploadDto { File = formFileMock.Object, ObjectTypeName = "Tech" };

            await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UploadAsync(input));
        }
        [Fact]
        public async Task UploadAsync_FileTooLarge_ThrowsInvalidOperationException()
        {
            var formFileMock = new Mock<IFormFile>();
            formFileMock.Setup(f => f.FileName).Returns("test.png");
            formFileMock.Setup(f => f.Length).Returns(FileConstants.MaxFileSize + 1);

            var input = new FileUploadDto { File = formFileMock.Object, ObjectTypeName = "Tech" };

            await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UploadAsync(input));
        }
        [Fact]
        public async Task UploadAsync_ObjectTypeNotFound_ThrowsException()
        {
            var formFileMock = new Mock<IFormFile>();
            formFileMock.Setup(f => f.FileName).Returns("test.jpg");
            formFileMock.Setup(f => f.Length).Returns(100);
            formFileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default)).Returns(Task.CompletedTask);

            _mockObjectTypeRepo.Setup(r => r.GetAll())
                    .Returns(new List<ObjectType>().BuildMock());

            var input = new FileUploadDto
            {
                File = formFileMock.Object,
                ObjectTypeName = "UnknownType",
                ObjectId = Guid.NewGuid(),
                RelationType = "Profile",
                UserId = Guid.NewGuid()
            };

            await Assert.ThrowsAsync<Exception>(() => _service.UploadAsync(input));
        }
        [Fact]
        public async Task UploadManyAsync_ShouldReturnSameCountAsInput()
        {
            var formFileMock = new Mock<IFormFile>();
            formFileMock.Setup(f => f.FileName).Returns("test.jpg");
            formFileMock.Setup(f => f.Length).Returns(100);
            formFileMock.Setup(f => f.ContentType).Returns("image/jpeg");
            formFileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default))
                    .Returns(Task.CompletedTask);

            var objectType = new ObjectType { Id = Guid.NewGuid(), Name = "Tech" };
            _mockObjectTypeRepo.Setup(r => r.GetAll())
                    .Returns(new List<ObjectType> { objectType }.BuildMock());

            var inputs = new List<FileUploadDto>
            {
               new FileUploadDto { File = formFileMock.Object, ObjectTypeName = "Tech", ObjectId = Guid.NewGuid() },
               new FileUploadDto { File = formFileMock.Object, ObjectTypeName = "Tech", ObjectId = Guid.NewGuid() }
            };

            var result = await _service.UploadManyAsync(inputs);

            Assert.Equal(inputs.Count, result.Count());
        }
        [Fact]
        public async Task UploadManyAsync_WhenOneFails_ShouldThrowAndStop()
        {
            var formFileMock = new Mock<IFormFile>();
            formFileMock.Setup(f => f.FileName).Returns("a.jpg");
            formFileMock.Setup(f => f.Length).Returns(10);
            formFileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default)).Returns(Task.CompletedTask);

            var objType = new ObjectType { Id = Guid.NewGuid(), Name = "Tech" };
            _mockObjectTypeRepo.Setup(r => r.GetAll())
                .Returns(new List<ObjectType> { objType }.BuildMock());

            var badFile = new Mock<IFormFile>();
            badFile.Setup(f => f.FileName).Returns("bad.exe");

            var inputs = new[]
            {
            new FileUploadDto { File = formFileMock.Object, ObjectTypeName="Tech", ObjectId=Guid.NewGuid()},
            new FileUploadDto { File = badFile.Object, ObjectTypeName="Tech", ObjectId=Guid.NewGuid()}
            };

            await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UploadManyAsync(inputs));
        }
        [Fact]
        public async Task UploadAsync_WithNullWebRoot_ShouldStillUpload()
        {
            _mockEnv.Setup(e => e.WebRootPath).Returns((string?)null);

            var formFileMock = new Mock<IFormFile>();
            formFileMock.Setup(f => f.FileName).Returns("test.png");
            formFileMock.Setup(f => f.ContentType).Returns("image/png");
            formFileMock.Setup(f => f.Length).Returns(100);
            formFileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default))
                        .Returns(Task.CompletedTask);

            var objectType = new ObjectType { Id = Guid.NewGuid(), Name = "Tech" };
            _mockObjectTypeRepo.Setup(r => r.GetAll())
                .Returns(new List<ObjectType> { objectType }.BuildMock());

            var input = new FileUploadDto
            {
                File = formFileMock.Object,
                ObjectTypeName = "Tech",
                ObjectId = Guid.NewGuid()
            };

            var result = await _service.UploadAsync(input);
            Assert.NotNull(result);
        }
        [Fact]
        public async Task UploadAsync_NullContentType_ShouldStillUpload()
        {
            var formFileMock = new Mock<IFormFile>();
            formFileMock.Setup(f => f.FileName).Returns("img.jpg");
            formFileMock.Setup(f => f.ContentType).Returns((string?)null);
            formFileMock.Setup(f => f.Length).Returns(50);
            formFileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), default))
                        .Returns(Task.CompletedTask);

            var objectType = new ObjectType { Id = Guid.NewGuid(), Name = "Tech" };
            _mockObjectTypeRepo.Setup(r => r.GetAll())
                .Returns(new List<ObjectType> { objectType }.BuildMock());

            var input = new FileUploadDto
            {
                File = formFileMock.Object,
                ObjectTypeName = "Tech",
                ObjectId = Guid.NewGuid()
            };

            var result = await _service.UploadAsync(input);

            Assert.NotNull(result);
            Assert.Equal("img.jpg", result.FileName);
        }

        [Fact]
        public async Task DeleteAsync_ShouldRemoveFileAndRelations()
        {
            var file = new Core.Entities.File { Id = Guid.NewGuid(), FilePath = "uploads/test.jpg" };
            _mockFileRepo.Setup(r => r.GetAll())
                    .Returns(new List<Core.Entities.File> { file }.BuildMock());

            _mockFileRelationRepo.Setup(r => r.GetAll())
                    .Returns(new List<FileRelation> { new FileRelation { FileId = file.Id } }.BuildMock());

            await _service.DeleteAsync(file.Id);

            _mockFileRelationRepo.Verify(r => r.RemoveRange(It.IsAny<IQueryable<FileRelation>>()), Times.Once);
            _mockFileRepo.Verify(r => r.HardDelete(It.IsAny<Core.Entities.File>()), Times.Once);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
        [Fact]
        public async Task DeleteAsync_FileNotFound_ShouldThrow()
        {
            _mockFileRepo.Setup(r => r.GetAll())
                .Returns(new List<Core.Entities.File>().BuildMock());

            await Assert.ThrowsAsync<Exception>(
                () => _service.DeleteAsync(Guid.NewGuid())
            );
        }
        [Fact]
        public async Task DeleteAsync_PhysicalFileExists_ShouldDeletePhysicalFile()
        {
            var file = new Core.Entities.File
            {
                Id = Guid.NewGuid(),
                FilePath = "uploads/test_delete_me.txt"
            };

            _mockFileRepo.Setup(r => r.GetAll())
                .Returns(new List<Core.Entities.File> { file }.BuildMock());

            _mockFileRelationRepo.Setup(r => r.GetAll())
                .Returns(new List<FileRelation>().BuildMock());

            var fullPath = Path.Combine(_mockEnv.Object.WebRootPath!, "uploads", "test_delete_me.txt");
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
            await System.IO.File.WriteAllTextAsync(fullPath, "test content");

            await _service.DeleteAsync(file.Id);

            Assert.False(System.IO.File.Exists(fullPath)); 
            _mockFileRepo.Verify(r => r.HardDelete(It.IsAny<Core.Entities.File>()), Times.Once);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
        [Fact]
        public async Task DeleteAsync_PhysicalFileNotExists_ShouldStillDeleteDbEntries()
        {
            var file = new Core.Entities.File
            {
                Id = Guid.NewGuid(),
                FilePath = "uploads/img.jpg"
            };

            _mockFileRepo.Setup(r => r.GetAll())
                .Returns(new List<Core.Entities.File> { file }.BuildMock());

            _mockFileRelationRepo.Setup(r => r.GetAll())
                .Returns(new List<FileRelation>().BuildMock());

            await _service.DeleteAsync(file.Id);

            _mockFileRepo.Verify(r => r.HardDelete(It.IsAny<Core.Entities.File>()), Times.Once);
            _mockUow.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
        [Fact]
        public async Task GetFileForDownload_FileExists_ShouldReturnResult()
        {
            var tempFile = Path.Combine(Path.GetTempPath(), "test.txt");
            await System.IO.File.WriteAllTextAsync(tempFile, "content");

            var relativePath = Path.GetFileName(tempFile);
            var result = await _service.GetFileForDownload(relativePath);

            Assert.NotNull(result);
            Assert.Equal("test.txt", result.FileName);
            System.IO.File.Delete(tempFile);
        }
        [Fact]
        public async Task GetFileForDownload_FileNotFound_ShouldThrow()
        {
            await Assert.ThrowsAsync<FileNotFoundException>(
                    () => _service.GetFileForDownload("nonexistent.txt"));
        }
        [Fact]
        public async Task GetFileForDownload_UnknownExtension_ShouldReturnOctetStream()
        {
            var tempFile = Path.Combine(Path.GetTempPath(), "test.abc");
            await System.IO.File.WriteAllTextAsync(tempFile, "data");

            var relative = Path.GetFileName(tempFile);

            var result = await _service.GetFileForDownload(relative);

            Assert.Equal("application/octet-stream", result.ContentType);

            System.IO.File.Delete(tempFile);
        }
        [Fact]
        public async Task GetFilesAsync_ShouldReturnFilesForObject()
        {
            // Arrange
            var objectId = Guid.NewGuid();
            var objectType = new ObjectType { Id = Guid.NewGuid(), Name = "technician" };
            var file = new Core.Entities.File { Id = Guid.NewGuid(), FileName = "file1.jpg" };
            var relation = new FileRelation
            {
                FileId = file.Id,
                ObjectId = objectId,
                ObjectTypeId = objectType.Id,
                File = file
            };

            _mockObjectTypeRepo.Setup(r => r.GetAll())
                    .Returns(new List<ObjectType> { objectType }.BuildMockDbSet().Object);

            _mockFileRelationRepo.Setup(r => r.GetAll())
                    .Returns(new List<FileRelation> { relation }.BuildMockDbSet().Object);

            var result = await _service.GetFilesAsync(objectId, "technician");

            Assert.Single(result);
            Assert.Equal("file1.jpg", result.First().FileName);
        }
        [Fact]
        public async Task GetFilesAsync_ObjectTypeNotFound_ShouldThrow()
        {
            _mockObjectTypeRepo.Setup(r => r.GetAll())
                .Returns(new List<ObjectType>().BuildMock());

            await Assert.ThrowsAsync<Exception>(
                () => _service.GetFilesAsync(Guid.NewGuid(), "UnknownType")
            );
        }
        [Fact]
        public async Task GetFilesAsync_NoRelations_ShouldReturnEmptyList()
        {
            var objectType = new ObjectType { Id = Guid.NewGuid(), Name = "tech" };
            _mockObjectTypeRepo.Setup(r => r.GetAll())
                .Returns(new List<ObjectType> { objectType }.BuildMock());

            _mockFileRelationRepo.Setup(r => r.GetAll())
                .Returns(new List<FileRelation>().BuildMock());

            var result = await _service.GetFilesAsync(Guid.NewGuid(), "tech");

            Assert.Empty(result);
        }
    }
}
