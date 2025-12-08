using HSP.Core.Constants.SystemSettings;
using HSP.Core.Dtos.SystemSettingDto;
using HSP.Core.Entities;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Implementations.Internal;
using Microsoft.Extensions.Localization;
using MockQueryable;
using Moq;
using Xunit;

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

        // ============================================================
        // TEST: GetAllSettingsAsync
        // ============================================================

        [Fact]
        public async Task GetAllSettingsAsync_ShouldReturnEmptyList_WhenNoSettings()
        {
            // Arrange
            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            // Act
            var result = await _service.GetAllSettingsAsync();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetAllSettingsAsync_ShouldReturnMaskedValues_ForSensitiveSettings()
        {
            // Arrange
            var data = new List<SystemSetting>
            {
                new SystemSetting 
                { 
                    Id = Guid.NewGuid(), 
                    Key = "A", 
                    Value = "123", 
                    Group = "G1", 
                    IsSensitive = true,
                    DateCreated = DateTime.UtcNow,
                    DateModified = DateTime.UtcNow
                },
                new SystemSetting 
                { 
                    Id = Guid.NewGuid(), 
                    Key = "B", 
                    Value = "456", 
                    Group = "G1", 
                    IsSensitive = false,
                    DateCreated = DateTime.UtcNow,
                    DateModified = DateTime.UtcNow
                }
            };

            _repoMock.Setup(r => r.GetAll()).Returns(data.BuildMock());

            // Act
            var result = await _service.GetAllSettingsAsync();

            // Assert
            var list = result.ToList();
            Assert.Equal(2, list.Count);
            Assert.Equal("***", list[0].Value);
            Assert.Equal("456", list[1].Value);
        }

        [Fact]
        public async Task GetAllSettingsAsync_ShouldOrderByGroupThenKey()
        {
            // Arrange
            var data = new List<SystemSetting>
            {
                new SystemSetting 
                { 
                    Id = Guid.NewGuid(), 
                    Key = "Z", 
                    Value = "1", 
                    Group = "B",
                    DateCreated = DateTime.UtcNow,
                    DateModified = DateTime.UtcNow
                },
                new SystemSetting 
                { 
                    Id = Guid.NewGuid(), 
                    Key = "A", 
                    Value = "2", 
                    Group = "A",
                    DateCreated = DateTime.UtcNow,
                    DateModified = DateTime.UtcNow
                },
                new SystemSetting 
                { 
                    Id = Guid.NewGuid(), 
                    Key = "B", 
                    Value = "3", 
                    Group = "A",
                    DateCreated = DateTime.UtcNow,
                    DateModified = DateTime.UtcNow
                }
            };

            _repoMock.Setup(r => r.GetAll()).Returns(data.BuildMock());

            // Act
            var result = await _service.GetAllSettingsAsync();

            // Assert
            var list = result.ToList();
            Assert.Equal(3, list.Count);
            Assert.Equal("A", list[0].Group);
            Assert.Equal("A", list[0].Key);
            Assert.Equal("A", list[1].Group);
            Assert.Equal("B", list[1].Key);
            Assert.Equal("B", list[2].Group);
            Assert.Equal("Z", list[2].Key);
        }

        [Fact]
        public async Task GetAllSettingsAsync_ShouldMapAllProperties()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dateCreated = DateTime.UtcNow.AddDays(-1);
            var dateModified = DateTime.UtcNow;
            var data = new List<SystemSetting>
            {
                new SystemSetting 
                { 
                    Id = id,
                    Key = "TestKey",
                    Value = "TestValue",
                    Description = "Test Description",
                    Group = "TestGroup",
                    IsSensitive = false,
                    DateCreated = dateCreated,
                    DateModified = dateModified
                }
            };

            _repoMock.Setup(r => r.GetAll()).Returns(data.BuildMock());

            // Act
            var result = await _service.GetAllSettingsAsync();

            // Assert
            var setting = result.First();
            Assert.Equal(id, setting.Id);
            Assert.Equal("TestKey", setting.Key);
            Assert.Equal("TestValue", setting.Value);
            Assert.Equal("Test Description", setting.Description);
            Assert.Equal("TestGroup", setting.Group);
            Assert.False(setting.IsSensitive);
            Assert.Equal(dateCreated, setting.DateCreated);
            Assert.Equal(dateModified, setting.DateModified);
        }

        // ============================================================
        // TEST: GetSettingsByGroupAsync
        // ============================================================

        [Fact]
        public async Task GetSettingsByGroupAsync_ShouldReturnEmptyDictionary_WhenNoSettings()
        {
            // Arrange
            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            // Act
            var result = await _service.GetSettingsByGroupAsync();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public async Task GetSettingsByGroupAsync_ShouldGroupCorrectly()
        {
            // Arrange
            var data = new List<SystemSetting>
            {
                new SystemSetting 
                { 
                    Id = Guid.NewGuid(), 
                    Key = "A", 
                    Value = "1", 
                    Group = "Group1",
                    DateCreated = DateTime.UtcNow,
                    DateModified = DateTime.UtcNow
                },
                new SystemSetting 
                { 
                    Id = Guid.NewGuid(), 
                    Key = "B", 
                    Value = "2", 
                    Group = null,
                    DateCreated = DateTime.UtcNow,
                    DateModified = DateTime.UtcNow
                },
                new SystemSetting 
                { 
                    Id = Guid.NewGuid(), 
                    Key = "C", 
                    Value = "3", 
                    Group = "Group1",
                    DateCreated = DateTime.UtcNow,
                    DateModified = DateTime.UtcNow
                }
            };

            _repoMock.Setup(r => r.GetAll()).Returns(data.BuildMock());

            // Act
            var result = await _service.GetSettingsByGroupAsync();

            // Assert
            Assert.True(result.ContainsKey("Group1"));
            Assert.True(result.ContainsKey("General"));
            Assert.Equal(2, result["Group1"].Count());
            Assert.Single(result["General"]);
        }

        // ============================================================
        // TEST: GetSettingByKeyAsync
        // ============================================================

        [Fact]
        public async Task GetSettingByKeyAsync_ShouldReturnNull_WhenNotFound()
        {
            // Arrange
            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            // Act
            var result = await _service.GetSettingByKeyAsync("abc");

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetSettingByKeyAsync_ShouldReturnSetting_WhenFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            var setting = new SystemSetting 
            { 
                Id = id, 
                Key = "K1", 
                Value = "value1",
                Description = "Description",
                Group = "Group1",
                IsSensitive = false,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow
            };

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting> { setting }.BuildMock());

            // Act
            var result = await _service.GetSettingByKeyAsync("K1");

            // Assert
            Assert.NotNull(result);
            Assert.Equal(id, result.Id);
            Assert.Equal("K1", result.Key);
            Assert.Equal("value1", result.Value);
        }

        [Fact]
        public async Task GetSettingByKeyAsync_ShouldMaskSensitiveValue()
        {
            // Arrange
            var setting = new SystemSetting 
            { 
                Id = Guid.NewGuid(), 
                Key = "K1", 
                Value = "secret", 
                IsSensitive = true,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow
            };

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting> { setting }.BuildMock());

            // Act
            var result = await _service.GetSettingByKeyAsync("K1");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("***", result.Value);
            Assert.True(result.IsSensitive);
        }

        // ============================================================
        // TEST: UpdateSettingAsync
        // ============================================================

        [Fact]
        public async Task UpdateSettingAsync_ShouldThrow_WhenInputNull()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() =>
                _service.UpdateSettingAsync(Guid.NewGuid(), "K1", null!));
        }

        [Fact]
        public async Task UpdateSettingAsync_ShouldThrow_WhenNotFound()
        {
            // Arrange
            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            var dto = new UpdateSystemSettingDto { Value = "new" };

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.UpdateSettingAsync(Guid.NewGuid(), "none", dto));
        }

        [Fact]
        public async Task UpdateSettingAsync_ShouldUpdate_WhenValuesChanged()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var setting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                Key = "A",
                Value = "1",
                Description = "old",
                DateModified = DateTime.UtcNow.AddDays(-1)
            };

            var data = new List<SystemSetting> { setting }.BuildMock();
            _repoMock.Setup(r => r.GetAll()).Returns(data);
            _repoMock.Setup(r => r.Update(It.IsAny<SystemSetting>()));
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var dto = new UpdateSystemSettingDto { Value = "2", Description = "new" };

            // Act
            var result = await _service.UpdateSettingAsync(userId, "A", dto);

            // Assert
            Assert.True(result);
            Assert.Equal("2", setting.Value);
            Assert.Equal("new", setting.Description);
            Assert.Equal(userId, setting.ModifiedBy);
            Assert.True(setting.DateModified > DateTime.UtcNow.AddMinutes(-1));
            _repoMock.Verify(r => r.Update(setting), Times.Once);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UpdateSettingAsync_ShouldUpdateOnlyValue_WhenDescriptionIsNull()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var setting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                Key = "A",
                Value = "1",
                Description = "old"
            };

            var data = new List<SystemSetting> { setting }.BuildMock();
            _repoMock.Setup(r => r.GetAll()).Returns(data);
            _repoMock.Setup(r => r.Update(It.IsAny<SystemSetting>()));
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var dto = new UpdateSystemSettingDto { Value = "2", Description = null };

            // Act
            var result = await _service.UpdateSettingAsync(userId, "A", dto);

            // Assert
            Assert.True(result);
            Assert.Equal("2", setting.Value);
            Assert.Equal("old", setting.Description); // Should remain unchanged
            _repoMock.Verify(r => r.Update(setting), Times.Once);
        }

        [Fact]
        public async Task UpdateSettingAsync_ShouldUpdateOnlyDescription_WhenValueIsSame()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var setting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                Key = "A",
                Value = "1",
                Description = "old"
            };

            var data = new List<SystemSetting> { setting }.BuildMock();
            _repoMock.Setup(r => r.GetAll()).Returns(data);
            _repoMock.Setup(r => r.Update(It.IsAny<SystemSetting>()));
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var dto = new UpdateSystemSettingDto { Value = "1", Description = "new" };

            // Act
            var result = await _service.UpdateSettingAsync(userId, "A", dto);

            // Assert
            Assert.True(result);
            Assert.Equal("1", setting.Value);
            Assert.Equal("new", setting.Description);
            _repoMock.Verify(r => r.Update(setting), Times.Once);
        }

        [Fact]
        public async Task UpdateSettingAsync_ShouldNotUpdate_WhenNoChanges()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var originalDateModified = DateTime.UtcNow.AddDays(-1);
            var setting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                Key = "A",
                Value = "1",
                Description = "old",
                DateModified = originalDateModified
            };

            var data = new List<SystemSetting> { setting }.BuildMock();
            _repoMock.Setup(r => r.GetAll()).Returns(data);

            var dto = new UpdateSystemSettingDto { Value = "1", Description = "old" };

            // Act
            var result = await _service.UpdateSettingAsync(userId, "A", dto);

            // Assert
            Assert.True(result);
            _repoMock.Verify(r => r.Update(It.IsAny<SystemSetting>()), Times.Never);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Never);
            Assert.Equal(originalDateModified, setting.DateModified);
        }

        // ============================================================
        // TEST: UpdateSettingByIdAsync
        // ============================================================

        [Fact]
        public async Task UpdateSettingByIdAsync_ShouldThrow_WhenInputNull()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() =>
                _service.UpdateSettingByIdAsync(Guid.NewGuid(), Guid.NewGuid(), null!));
        }

        [Fact]
        public async Task UpdateSettingByIdAsync_ShouldThrow_WhenNotFound()
        {
            // Arrange
            _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((SystemSetting?)null);

            var dto = new UpdateSystemSettingDto { Value = "new" };

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.UpdateSettingByIdAsync(Guid.NewGuid(), Guid.NewGuid(), dto));
        }

        [Fact]
        public async Task UpdateSettingByIdAsync_ShouldUpdate_WhenChanged()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var setting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                Value = "x",
                Description = "y"
            };

            _repoMock.Setup(r => r.GetByIdAsync(setting.Id)).ReturnsAsync(setting);
            _repoMock.Setup(r => r.Update(setting));
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var dto = new UpdateSystemSettingDto { Value = "z", Description = "y2" };

            // Act
            var result = await _service.UpdateSettingByIdAsync(userId, setting.Id, dto);

            // Assert
            Assert.True(result);
            Assert.Equal("z", setting.Value);
            Assert.Equal("y2", setting.Description);
            Assert.Equal(userId, setting.ModifiedBy);
            _repoMock.Verify(r => r.Update(setting), Times.Once);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UpdateSettingByIdAsync_ShouldNotUpdate_WhenNoChanges()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var originalDateModified = DateTime.UtcNow.AddDays(-1);
            var setting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                Value = "x",
                Description = "y",
                DateModified = originalDateModified
            };

            _repoMock.Setup(r => r.GetByIdAsync(setting.Id)).ReturnsAsync(setting);

            var dto = new UpdateSystemSettingDto { Value = "x", Description = "y" };

            // Act
            var result = await _service.UpdateSettingByIdAsync(userId, setting.Id, dto);

            // Assert
            Assert.True(result);
            _repoMock.Verify(r => r.Update(It.IsAny<SystemSetting>()), Times.Never);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Never);
            Assert.Equal(originalDateModified, setting.DateModified);
        }

        // ============================================================
        // TEST: DeleteSettingAsync
        // ============================================================

        [Fact]
        public async Task DeleteSettingAsync_ShouldThrow_WhenNotFound()
        {
            // Arrange
            _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((SystemSetting?)null);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _service.DeleteSettingAsync(Guid.NewGuid(), Guid.NewGuid()));
        }

        [Fact]
        public async Task DeleteSettingAsync_ShouldDeleteSuccessfully()
        {
            // Arrange
            var settingId = Guid.NewGuid();
            var setting = new SystemSetting { Id = settingId };

            _repoMock.Setup(r => r.GetByIdAsync(settingId)).ReturnsAsync(setting);
            _repoMock.Setup(r => r.DeleteAsync(settingId)).Returns(Task.CompletedTask);
            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _service.DeleteSettingAsync(Guid.NewGuid(), settingId);

            // Assert
            Assert.True(result);
            _repoMock.Verify(r => r.DeleteAsync(settingId), Times.Once);
            _uowMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        // ============================================================
        // TEST: GetSettingValueAsync
        // ============================================================

        [Fact]
        public async Task GetSettingValueAsync_ShouldReturnValue_WhenFound()
        {
            // Arrange
            var setting = new SystemSetting 
            { 
                Key = "K1", 
                Value = "found_value" 
            };

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting> { setting }.BuildMock());

            // Act
            var result = await _service.GetSettingValueAsync("K1");

            // Assert
            Assert.Equal("found_value", result);
        }

        [Fact]
        public async Task GetSettingValueAsync_ShouldReturnDefault_WhenNotFound()
        {
            // Arrange
            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            // Act
            var result = await _service.GetSettingValueAsync("none", "default");

            // Assert
            Assert.Equal("default", result);
        }

        [Fact]
        public async Task GetSettingValueAsync_ShouldReturnEmptyString_WhenNotFoundAndNoDefault()
        {
            // Arrange
            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            // Act
            var result = await _service.GetSettingValueAsync("none");

            // Assert
            Assert.Equal("", result);
        }

        // ============================================================
        // TEST: CreateSystemSettingAsync
        // ============================================================

        [Fact]
        public async Task CreateSystemSettingAsync_ShouldThrow_WhenInputNull()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() =>
                _service.CreateSystemSettingAsync(null!));
        }

        [Fact]
        public async Task CreateSystemSettingAsync_ShouldThrow_WhenKeyAlreadyExists()
        {
            // Arrange
            var existingSetting = new SystemSetting 
            { 
                Key = "ExistingKey", 
                Value = "value" 
            };

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting> { existingSetting }.BuildMock());

            var input = new CreateSystemSettingDto 
            { 
                Key = "ExistingKey", 
                Value = "new_value" 
            };

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _service.CreateSystemSettingAsync(input));
        }

        [Fact]
        public async Task CreateSystemSettingAsync_ShouldUseRegistryDefaults_WhenKeyInRegistry()
        {
            // Arrange
            var expectedId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var registryKey = SystemSettingRegistry.Keys.TechnicianResponseTimeoutSeconds;

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            SystemSetting? capturedSetting = null;
            _repoMock.Setup(r => r.AddAsync(It.IsAny<SystemSetting>()))
                .Callback<SystemSetting>(s =>
                {
                    capturedSetting = s;
                    s.Id = expectedId;
                })
                .ReturnsAsync((SystemSetting s) => s);

            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var input = new CreateSystemSettingDto 
            { 
                Key = registryKey,
                CreatedBy = userId
                // Value, Description, Group are null - should use registry defaults
            };

            // Act
            var result = await _service.CreateSystemSettingAsync(input);

            // Assert
            Assert.Equal(expectedId, result);
            Assert.NotNull(capturedSetting);
            Assert.Equal(registryKey, capturedSetting.Key);
            Assert.Equal(SystemSettingRegistry.All[registryKey].DefaultValue, capturedSetting.Value);
            Assert.Equal(SystemSettingRegistry.All[registryKey].Group, capturedSetting.Group);
            Assert.Equal(SystemSettingRegistry.All[registryKey].Description, capturedSetting.Description);
            Assert.Equal(userId, capturedSetting.CreatedBy);
            Assert.True(capturedSetting.DateCreated > DateTime.UtcNow.AddMinutes(-1));
        }

        [Fact]
        public async Task CreateSystemSettingAsync_ShouldCreate_WhenKeyNotInRegistry()
        {
            // Arrange
            var expectedId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            SystemSetting? capturedSetting = null;
            _repoMock.Setup(r => r.AddAsync(It.IsAny<SystemSetting>()))
                .Callback<SystemSetting>(s =>
                {
                    capturedSetting = s;
                    s.Id = expectedId;
                })
                .ReturnsAsync((SystemSetting s) => s);

            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var input = new CreateSystemSettingDto 
            { 
                Key = "CustomKey",
                Value = "CustomValue",
                Description = "Custom Description",
                Group = "CustomGroup",
                IsSensitive = true,
                CreatedBy = userId
            };

            // Act
            var result = await _service.CreateSystemSettingAsync(input);

            // Assert
            Assert.Equal(expectedId, result);
            Assert.NotNull(capturedSetting);
            Assert.Equal("CustomKey", capturedSetting.Key);
            Assert.Equal("CustomValue", capturedSetting.Value);
            Assert.Equal("Custom Description", capturedSetting.Description);
            Assert.Equal("CustomGroup", capturedSetting.Group);
            Assert.True(capturedSetting.IsSensitive);
            Assert.Equal(userId, capturedSetting.CreatedBy);
            Assert.True(capturedSetting.DateCreated > DateTime.UtcNow.AddMinutes(-1));
        }

        [Fact]
        public async Task CreateSystemSettingAsync_ShouldOverrideRegistryDefaults_WhenProvided()
        {
            // Arrange
            var expectedId = Guid.NewGuid();
            var registryKey = SystemSettingRegistry.Keys.TechnicianResponseTimeoutSeconds;

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            SystemSetting? capturedSetting = null;
            _repoMock.Setup(r => r.AddAsync(It.IsAny<SystemSetting>()))
                .Callback<SystemSetting>(s =>
                {
                    capturedSetting = s;
                    s.Id = expectedId;
                })
                .ReturnsAsync((SystemSetting s) => s);

            _uowMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            var input = new CreateSystemSettingDto 
            { 
                Key = registryKey,
                Value = "CustomValue",
                Description = "Custom Description",
                Group = "CustomGroup"
            };

            // Act
            var result = await _service.CreateSystemSettingAsync(input);

            // Assert
            Assert.Equal(expectedId, result);
            Assert.NotNull(capturedSetting);
            Assert.Equal("CustomValue", capturedSetting.Value);
            Assert.Equal("Custom Description", capturedSetting.Description);
            Assert.Equal("CustomGroup", capturedSetting.Group);
        }

        // ============================================================
        // TEST: GetValueAsync<T>
        // ============================================================

        [Fact]
        public async Task GetValueAsync_ShouldReturnParsedInt_WhenValueIsValid()
        {
            // Arrange
            var setting = new SystemSetting 
            { 
                Key = "K1", 
                Value = "42" 
            };

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting> { setting }.BuildMock());

            // Act
            var result = await _service.GetValueAsync<int>("K1");

            // Assert
            Assert.Equal(42, result);
        }

        [Fact]
        public async Task GetValueAsync_ShouldReturnParsedBool_WhenValueIsValid()
        {
            // Arrange
            var setting = new SystemSetting 
            { 
                Key = "K1", 
                Value = "true" 
            };

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting> { setting }.BuildMock());

            // Act
            var result = await _service.GetValueAsync<bool>("K1");

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task GetValueAsync_ShouldReturnParsedDecimal_WhenValueIsValid()
        {
            // Arrange
            var setting = new SystemSetting 
            { 
                Key = "K1", 
                Value = "123.45" 
            };

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting> { setting }.BuildMock());

            // Act
            var result = await _service.GetValueAsync<decimal>("K1");

            // Assert
            Assert.Equal(123.45m, result);
        }

        [Fact]
        public async Task GetValueAsync_ShouldReturnDefault_WhenNotFound()
        {
            // Arrange
            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            // Act
            var result = await _service.GetValueAsync<int>("none");

            // Assert
            Assert.Equal(0, result);
        }

        [Fact]
        public async Task GetValueAsync_ShouldReturnRegistryDefault_WhenNotFoundAndKeyInRegistry()
        {
            // Arrange
            var registryKey = SystemSettingRegistry.Keys.TechnicianResponseTimeoutSeconds;
            var expectedDefault = int.Parse(SystemSettingRegistry.All[registryKey].DefaultValue);

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            // Act
            var result = await _service.GetValueAsync<int>(registryKey);

            // Assert
            Assert.Equal(expectedDefault, result);
        }

        [Fact]
        public async Task GetValueAsync_ShouldReturnRegistryDefault_WhenConversionFailsAndKeyInRegistry()
        {
            // Arrange
            var registryKey = SystemSettingRegistry.Keys.TechnicianResponseTimeoutSeconds;
            var expectedDefault = int.Parse(SystemSettingRegistry.All[registryKey].DefaultValue);
            var setting = new SystemSetting 
            { 
                Key = registryKey, 
                Value = "not_a_number" 
            };

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting> { setting }.BuildMock());

            // Act
            var result = await _service.GetValueAsync<int>(registryKey);

            // Assert
            Assert.Equal(expectedDefault, result);
        }

        [Fact]
        public async Task GetValueAsync_ShouldReturnDefault_WhenConversionFailsAndKeyNotInRegistry()
        {
            // Arrange
            var setting = new SystemSetting 
            { 
                Key = "K1", 
                Value = "not_a_number" 
            };

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting> { setting }.BuildMock());

            // Act
            var result = await _service.GetValueAsync<int>("K1");

            // Assert
            Assert.Equal(0, result);
        }

        [Fact]
        public async Task GetValueAsync_ShouldReturnString_WhenTypeIsString()
        {
            // Arrange
            var setting = new SystemSetting 
            { 
                Key = "K1", 
                Value = "test_string" 
            };

            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting> { setting }.BuildMock());

            // Act
            var result = await _service.GetValueAsync<string>("K1");

            // Assert
            Assert.Equal("test_string", result);
        }

        [Fact]
        public async Task GetValueAsync_ShouldReturnNull_WhenNotFoundAndTypeIsString()
        {
            // Arrange
            _repoMock.Setup(r => r.GetAll())
                .Returns(new List<SystemSetting>().BuildMock());

            // Act
            var result = await _service.GetValueAsync<string>("none");

            // Assert
            Assert.Null(result);
        }
    }
}
