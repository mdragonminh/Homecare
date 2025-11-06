using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations;
using Microsoft.Extensions.Localization;
using MockQueryable;
using Moq;

namespace HSP.Service.Test.Implementations
{
	public class TechnicianLocationServiceTests
	{
		private Mock<IRepository<TechnicianProfile, Guid>> _mockTechnicianProfileRepository;
		private readonly Mock<IUnitOfWork> _mockUnitOfWork;
		private readonly Mock<IStringLocalizer<SharedResource>> _mockLocalizer;
		private readonly TechnicianLocationService _technicianLocationService;
		public TechnicianLocationServiceTests()
		{
			_mockTechnicianProfileRepository = new Mock<IRepository<TechnicianProfile, Guid>>();
			_mockUnitOfWork = new Mock<IUnitOfWork>();
			_mockLocalizer = new Mock<IStringLocalizer<SharedResource>>();
			_technicianLocationService = new TechnicianLocationService(_mockTechnicianProfileRepository.Object,
				_mockUnitOfWork.Object,
				_mockLocalizer.Object
				);
		}
		[Fact]
		public async Task UpdateLocationAsync_ValidInput_ShouldUpdateLocation()
		{
			Guid currentTechId = Guid.NewGuid();
			var input = new Core.Dtos.TechnicianProfileDto.UpdateLocationDto
			{
				Latitude = 40.7128,
				Longitude = -74.0060
			};
			var technicianProfile = new TechnicianProfile
			{
				UserId = currentTechId,
				ApprovalStatus = Core.Enums.TechnicianApprovalStatus.Approved,
				Latitude = 40.7120,
				Longitude = -74.0050
			};
			_mockTechnicianProfileRepository.Setup(repo => repo.GetAll())
				.Returns(new List<TechnicianProfile> { technicianProfile }.BuildMock());

			await _technicianLocationService.UpdateLocationAsync(input, currentTechId);

			Assert.Equal(input.Latitude, technicianProfile.Latitude);
			Assert.Equal(input.Longitude, technicianProfile.Longitude);
			_mockUnitOfWork.Verify(uow => uow.SaveChangesAsync(), Times.Once);
		}
		[Fact]
		public async Task UpdateLocationAsync_InputIsNull_ThrowsArgumentNullException()
		{
			Guid currentTechId = Guid.NewGuid();
			await Assert.ThrowsAsync<ArgumentNullException>(() => _technicianLocationService.UpdateLocationAsync(null, currentTechId));
		}
		[Fact]
		public async Task UpdateLocationAsync_TechnicianNotFound_ThrowsArgumentException()
		{
			Guid currentTechId = Guid.NewGuid();
			var input = new Core.Dtos.TechnicianProfileDto.UpdateLocationDto
			{
				Latitude = 40.7128,
				Longitude = -74.0060
			};
			_mockTechnicianProfileRepository.Setup(repo => repo.GetAll())
				.Returns(new List<TechnicianProfile>().BuildMock());

			_mockLocalizer.Setup(loc => loc["TechnicianNotFound"])
				.Returns(new Microsoft.Extensions.Localization.LocalizedString("TechnicianNotFound", "Technician not found."));

			var exception = await Assert.ThrowsAsync<ArgumentException>(() => _technicianLocationService.UpdateLocationAsync(input, currentTechId));
			Assert.Equal("Technician not found.", exception.Message);
		}
		[Fact]
		public async Task UpdateLocationAsync_MinorMovement_ShouldNotUpdateOrSave()
		{
			Guid currentTechId = Guid.NewGuid();
			var input = new Core.Dtos.TechnicianProfileDto.UpdateLocationDto
			{
				Latitude = 40.7128,
				Longitude = -74.0060
			};
			var technicianProfile = new TechnicianProfile
			{
				UserId = currentTechId,
				ApprovalStatus = Core.Enums.TechnicianApprovalStatus.Approved,
				Latitude = 40.7126,
				Longitude = -74.0057
			};

			_mockTechnicianProfileRepository.Setup(repo => repo.GetAll())
				.Returns(new List<TechnicianProfile> { technicianProfile }.BuildMock());

			await _technicianLocationService.UpdateLocationAsync(input, currentTechId);

			Assert.Equal(40.7126, technicianProfile.Latitude);
			Assert.Equal(-74.0057, technicianProfile.Longitude);
			_mockUnitOfWork.Verify(uow => uow.SaveChangesAsync(), Times.Never);
		}
	}
}
