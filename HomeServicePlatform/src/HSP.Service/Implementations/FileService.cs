using HSP.Core.Constants;
using HSP.Core.Dtos.FileDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations
{
	public class FileService : BaseService, IFileService
	{
		private readonly IRepository<HSP.Core.Entities.File, Guid> _fileRepository;
		private readonly IRepository<FileRelation, Guid> _fileRelationRepository;
		private readonly IRepository<ObjectType, Guid> _objectTypeRepository;
		private readonly IWebHostEnvironment _environment;

		public FileService(IRepository<HSP.Core.Entities.File, Guid> fileRepository,
			IRepository<FileRelation, Guid> fileRelationRepository,
			IRepository<ObjectType, Guid> objectTypeRepository,
			IWebHostEnvironment environment,
			IUnitOfWork unitOfWork,
			IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_fileRepository = fileRepository;
			_fileRelationRepository = fileRelationRepository;
			_objectTypeRepository = objectTypeRepository;
			_environment = environment;
		}

		public async Task<FileDto> UploadAsync(FileUploadDto input)
		{
			var file = input.File ?? throw new ArgumentException("Invalid file upload");
			var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
			if (!FileConstants.AllowedImageExtensions
				.Concat(FileConstants.AllowedDocumentExtensions)
				.Contains(extension))
				throw new InvalidOperationException($"Unsupported file type: {extension}");

			if (file.Length > FileConstants.MaxFileSize)
				throw new InvalidOperationException("File too large");

			var uploadFolder = Path.Combine(_environment.WebRootPath ?? "wwwroot", FileConstants.UploadRoot, input.ObjectTypeName);
			Directory.CreateDirectory(uploadFolder);

			var fileName = $"{Guid.NewGuid():N}{extension}";
			var filePath = Path.Combine(uploadFolder, fileName);
			var relativePath = Path.Combine(FileConstants.UploadRoot, input.ObjectTypeName, fileName)
											 .Replace("\\", "/");

			using (var stream = new FileStream(filePath, FileMode.Create))
				await file.CopyToAsync(stream);

			var objectType = await _objectTypeRepository.GetAll().FirstOrDefaultAsync(x => x.Name == input.ObjectTypeName)
					?? throw new Exception($"ObjectType '{input.ObjectTypeName}' not found");
			var fileEntity = new Core.Entities.File
			{
				Id = Guid.NewGuid(),
				FileName = file.FileName,
				FilePath = relativePath,
				FileType = file.ContentType,
				FileSize = file.Length,
				UploadedBy = Guid.Empty,
				DateCreated = DateTime.UtcNow
			};
			var relation = new FileRelation
			{
				Id = Guid.NewGuid(),
				File = fileEntity,
				ObjectTypeId = objectType.Id,
				ObjectId = input.ObjectId,
				RelationType = input.RelationType
			};
			using (var transaction = await _unitOfWork.BeginTransactionAsync())
			{
				try {
					await _fileRepository.AddAsync(fileEntity);
					await _fileRelationRepository.AddAsync(relation);
					await _unitOfWork.SaveChangesAsync();
					await _unitOfWork.CommitTransactionAsync();
				}
				catch { 
					await transaction.RollbackAsync();
					if (System.IO.File.Exists(filePath))	System.IO.File.Delete(filePath);
					throw; 
				}
			}
			return new FileDto
			{
				Id = fileEntity.Id,
				FileName = fileEntity.FileName,
				FilePath = fileEntity.FilePath,
				FileType = fileEntity.FileType,
				FileSize = fileEntity.FileSize
			};
		}

		public async Task<IEnumerable<FileDto>> UploadManyAsync(IEnumerable<FileUploadDto> inputs)
		{
			var results = new List<FileDto>();
			foreach (var input in inputs)
				results.Add(await UploadAsync(input));
			return results;
		}

		public async Task<IEnumerable<FileDto>> GetFilesAsync(Guid objectId, string objectTypeName)
		{
			var objectType = await _objectTypeRepository.GetAll().FirstOrDefaultAsync(x => x.Name == objectTypeName)
					?? throw new Exception($"ObjectType '{objectTypeName}' not found");

			return await _fileRelationRepository.GetAll()
					.Include(fr => fr.File)
					.Where(fr => fr.ObjectId == objectId && fr.ObjectTypeId == objectType.Id)
					.Select(fr => new FileDto
					{
						Id = fr.File.Id,
						FileName = fr.File.FileName,
						FilePath = fr.File.FilePath,
						FileType = fr.File.FileType,
						FileSize = fr.File.FileSize
					})
					.ToListAsync();
		}

		public async Task DeleteAsync(Guid fileId)
		{
			var file = await _fileRepository.GetAll().FirstOrDefaultAsync(f => f.Id == fileId)
					?? throw new Exception("File not found");

			var fullPath = Path.Combine(_environment.WebRootPath ?? "wwwroot", file.FilePath.TrimStart('/'));
			if (System.IO.File.Exists(fullPath))
				System.IO.File.Delete(fullPath);

			var relations = _fileRelationRepository.GetAll().Where(r => r.FileId == file.Id);
			await _fileRelationRepository.RemoveRange(relations);
			_fileRepository.HardDelete(file);
			await _unitOfWork.SaveChangesAsync();
		}
	}
}
