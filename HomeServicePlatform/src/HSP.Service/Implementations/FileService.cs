using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.DAL.Interfaces;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using System.IO;

namespace HSP.Service.Implementations
{
    public class FileService : IFileService
    {
        private readonly IRepository<HSP.Core.Entities.File, Guid> _fileRepository;
        private readonly IRepository<FileRelation, Guid> _fileRelationRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IHostEnvironment _environment;
        private readonly string[] _allowedImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".bmp" };
        private readonly string[] _allowedDocumentExtensions = { ".pdf", ".doc", ".docx", ".txt" };
        private readonly long _maxFileSize = 10 * 1024 * 1024; // 10MB

        public FileService(
            IRepository<HSP.Core.Entities.File, Guid> fileRepository,
            IRepository<FileRelation, Guid> fileRelationRepository,
            IUnitOfWork unitOfWork,
            IHostEnvironment environment)
        {
            _fileRepository = fileRepository;
            _fileRelationRepository = fileRelationRepository;
            _unitOfWork = unitOfWork;
            _environment = environment;
        }
        public async Task<string> UploadFileAsync(IFormFile file, string subFolder = "")
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty or null");

            // Validate file
            var allowedExtensions = _allowedImageExtensions.Concat(_allowedDocumentExtensions).ToArray();
            if (!ValidateFileType(file, allowedExtensions))
                throw new ArgumentException("File type is not allowed");

            if (!ValidateFileSize(file, _maxFileSize))
                throw new ArgumentException("File size exceeds limit");

            // Create upload directory
            var uploadsFolder = Path.Combine(_environment.ContentRootPath, "uploads", subFolder);
            Directory.CreateDirectory(uploadsFolder);

            // Generate unique filename
            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Save file
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            // Return relative path for storing in database
            return Path.Combine("uploads", subFolder, uniqueFileName).Replace("\\", "/");
        }

        public async Task<List<string>> UploadMultipleFilesAsync(IList<IFormFile> files, string subFolder = "")
        {
            var uploadedPaths = new List<string>();

            foreach (var file in files)
            {
                try
                {
                    var filePath = await UploadFileAsync(file, subFolder);
                    uploadedPaths.Add(filePath);
                }
                catch (Exception)
                {
                    // Log error và continue với files khác
                    // Có thể thêm logging service ở đây
                    continue;
                }
            }

            return uploadedPaths;
        }

        public async Task<bool> DeleteFileAsync(string filePath)
        {
            try
            {
                var fullPath = Path.Combine(_environment.ContentRootPath, filePath);
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        }

        public async Task<HSP.Core.Entities.File> SaveFileInfoAsync(string fileName, string filePath, string fileType, long fileSize, Guid uploadedBy)
        {
            var fileEntity = new HSP.Core.Entities.File
            {
                Id = Guid.NewGuid(),
                FileName = fileName,
                FilePath = filePath,
                FileType = fileType,
                FileSize = fileSize,
                UploadedBy = uploadedBy,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow
            };

            await _fileRepository.AddAsync(fileEntity);
            await _unitOfWork.SaveChangesAsync();
            return fileEntity;
        }
        public async Task<bool> CreateFileRelationAsync(Guid fileId, Guid objectId, Guid objectTypeId, string relationType)
        {
            var relation = new FileRelation
            {
                Id = Guid.NewGuid(),
                FileId = fileId,
                ObjectId = objectId,
                ObjectTypeId = objectTypeId,
                RelationType = relationType,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow
            };

            await _fileRelationRepository.AddAsync(relation);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public bool ValidateFileType(IFormFile file, string[] allowedExtensions)
        {
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            return allowedExtensions.Contains(fileExtension);
        }

        public bool ValidateFileSize(IFormFile file, long maxSizeInBytes)
        {
            return file.Length <= maxSizeInBytes;
        }
    }
}
