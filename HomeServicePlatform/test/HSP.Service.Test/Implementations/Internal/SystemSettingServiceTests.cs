using HSP.Core.Dtos.SystemSettingDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations.Internal;
using Microsoft.Extensions.Localization;
using MockQueryable;
using Moq;

namespace HSP.Service.Test.Implementations.Internal
{
    public class SystemSettingServiceTests
    {
        private readonly Mock<IRepository<SystemSetting, Guid>> _repoMock;
        private readonly Mock<IUnitOfWork> _uowMock;
        private readonly Mock<IStringLocalizer<SharedResource>> _localizerMock;
        private readonly SystemSettingService _service;

        public SystemSettingServiceTests()
        {
            _repoMock = new Mock<IRepository<SystemSetting, Guid>>();
            _uowMock = new Mock<IUnitOfWork>();
            _localizerMock = new Mock<IStringLocalizer<SharedResource>>();

            _localizerMock.Setup(l => l[It.IsAny<string>()])
                .Returns((string key) => new LocalizedString(key, key));

            _service = new SystemSettingService(
                _repoMock.Object,
                _uowMock.Object,
                _localizerMock.Object
            );
        }

        [Fact]
        public async Task GetAllSettingsAsync_ShouldReturnMaskedValues_ForSensitiveSettings()
        {
            var data = new List<SystemSetting>
            {
                new SystemSetting { Id = Guid.NewGuid(), Key="A", Value="123", Group="G1", IsSensitive=true },
                new SystemSetting { Id = Guid.NewGuid(), Key="B", Value="456", Group="G1", IsSensitive=false }
            }
            .BuildMock();

            _repoMock.Setup(r => r.GetAll()).Returns(data);

            var result = await _service.GetAllSettingsAsync();

            var list = result.ToList();
            Assert.Equal("***", list[0].Value);
            Assert.Equal("456", list[1].Value);
        }

        [Fact]
        public async Task GetSettingsByGroupAsync_ShouldGroupCorrectly()
        {
            var data = new List<SystemSetting>
            {
                new SystemSetting { Id=Guid.NewGuid(), Key="A", Value="1", Group="Group1" },
                new SystemSetting { Id=Guid.NewGuid(), Key="B", Value="2", Group=null }
            }
            .BuildMock();

            _repoMock.Setup(r => r.GetAll()).Returns(data);

            var result = await _service.GetSettingsByGroupAsync();

            Assert.True(result.ContainsKey("Group1"));
            Assert.True(result.ContainsKey("General"));
        }

        [Fact]
        public async Task GetSettingByKeyAsync_ShouldReturnNull_WhenNotFound()
        {
            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            var result = await _service.GetSettingByKeyAsync("abc");

            Assert.Null(result);
        }

        [Fact]
        public async Task GetSettingByKeyAsync_ShouldMaskSensitiveValue()
        {
            var setting = new SystemSetting { Id = Guid.NewGuid(), Key = "K1", Value = "secret", IsSensitive = true };

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting> { setting }.BuildMock());

            var result = await _service.GetSettingByKeyAsync("K1");

            Assert.Equal("***", result!.Value);
        }

        [Fact]
        public async Task UpdateSettingAsync_ShouldThrow_WhenInputNull()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() =>
                _service.UpdateSettingAsync(Guid.NewGuid(), "K1", null!));
        }

        [Fact]
        public async Task UpdateSettingAsync_ShouldThrow_WhenNotFound()
        {
            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            var dto = new UpdateSystemSettingDto();

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.UpdateSettingAsync(Guid.NewGuid(), "none", dto));
        }

        [Fact]
        public async Task UpdateSettingAsync_ShouldUpdate_WhenValuesChanged()
        {
            var setting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                Key = "A",
                Value = "1",
                Description = "old"
            };

            var data = new List<SystemSetting> { setting }.BuildMock();

            _repoMock.Setup(r => r.GetAll()).Returns(data);

            var dto = new UpdateSystemSettingDto { Value = "2", Description = "new" };

            _repoMock.Setup(r => r.Update(It.IsAny<SystemSetting>()));

            var result = await _service.UpdateSettingAsync(Guid.NewGuid(), "A", dto);

            Assert.True(result);
            Assert.Equal("2", setting.Value);
            Assert.Equal("new", setting.Description);
        }

        [Fact]
        public async Task UpdateSettingAsync_ShouldNotUpdate_WhenNoChanges()
        {
            var setting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                Key = "A",
                Value = "1",
                Description = "old"
            };

            var data = new List<SystemSetting> { setting }.BuildMock();
            _repoMock.Setup(r => r.GetAll()).Returns(data);

            var dto = new UpdateSystemSettingDto { Value = "1", Description = "old" };

            var result = await _service.UpdateSettingAsync(Guid.NewGuid(), "A", dto);

            Assert.True(result);
            _repoMock.Verify(r => r.Update(It.IsAny<SystemSetting>()), Times.Never);
        }

        [Fact]
        public async Task UpdateSettingByIdAsync_ShouldThrow_WhenInputNull()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() =>
                _service.UpdateSettingByIdAsync(Guid.NewGuid(), Guid.NewGuid(), null!));
        }

        [Fact]
        public async Task UpdateSettingByIdAsync_ShouldThrow_WhenNotFound()
        {
            _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((SystemSetting?)null);

            var dto = new UpdateSystemSettingDto();

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.UpdateSettingByIdAsync(Guid.NewGuid(), Guid.NewGuid(), dto));
        }

        [Fact]
        public async Task UpdateSettingByIdAsync_ShouldUpdate_WhenChanged()
        {
            var setting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                Value = "x",
                Description = "y"
            };

            _repoMock.Setup(r => r.GetByIdAsync(setting.Id)).ReturnsAsync(setting);
            _repoMock.Setup(r => r.Update(setting));

            var dto = new UpdateSystemSettingDto { Value = "z", Description = "y2" };

            var result = await _service.UpdateSettingByIdAsync(Guid.NewGuid(), setting.Id, dto);

            Assert.True(result);
            Assert.Equal("z", setting.Value);
            Assert.Equal("y2", setting.Description);
        }

        [Fact]
        public async Task DeleteSettingAsync_ShouldThrow_WhenNotFound()
        {
            _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((SystemSetting?)null);

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.DeleteSettingAsync(Guid.NewGuid(), Guid.NewGuid()));
        }

        [Fact]
        public async Task DeleteSettingAsync_ShouldDeleteSuccessfully()
        {
            var setting = new SystemSetting { Id = Guid.NewGuid() };

            _repoMock.Setup(r => r.GetByIdAsync(setting.Id)).ReturnsAsync(setting);
            _repoMock.Setup(r => r.DeleteAsync(setting.Id));
            _uowMock.Setup(u => u.SaveChangesAsync());

            var result = await _service.DeleteSettingAsync(Guid.NewGuid(), setting.Id);

            Assert.True(result);
        }

        [Fact]
        public async Task GetSettingValueAsync_ShouldReturnDefault_WhenNotFound()
        {
            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            var result = await _service.GetSettingValueAsync("none", "default");

            Assert.Equal("default", result);
        }

        [Fact]
        public async Task GetSettingValueAsIntAsync_ShouldReturnDefault_WhenInvalid()
        {
            var data = new List<SystemSetting> {
                new SystemSetting{ Key="K1", Value="notInt" }
            }
            .BuildMock();

            _repoMock.Setup(r => r.GetAll()).Returns(data);

            var result = await _service.GetSettingValueAsIntAsync("K1", 99);

            Assert.Equal(99, result);
        }

        [Fact]
        public async Task GetSettingValueAsBoolAsync_ShouldReturnParsedValue()
        {
            var data = new List<SystemSetting> {
                new SystemSetting{ Key="K1", Value="true" }
            }
            .BuildMock();

            _repoMock.Setup(r => r.GetAll()).Returns(data);

            var result = await _service.GetSettingValueAsBoolAsync("K1", false);

            Assert.True(result);
        }

        [Fact]
        public async Task GetSettingValueAsDecimalAsync_ShouldReturnDefault_WhenInvalid()
        {
            var data = new List<SystemSetting> {
                new SystemSetting{ Key="K1", Value="abc" }
            }
            .BuildMock();

            _repoMock.Setup(r => r.GetAll()).Returns(data);

            var result = await _service.GetSettingValueAsDecimalAsync("K1", 12.5m);

            Assert.Equal(12.5m, result);
        }
    }
}
