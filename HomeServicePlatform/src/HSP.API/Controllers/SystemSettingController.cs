using HSP.API.Extensions;
using HSP.Core.Constans;
using HSP.Core.Dtos.SystemSettingDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HSP.API.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	[Authorize(Roles = RoleNames.Admin)]
	public class SystemSettingController : ControllerBase
	{
		private readonly ISystemSettingService _systemSettingService;

		public SystemSettingController(ISystemSettingService systemSettingService)
		{
			_systemSettingService = systemSettingService;
		}

		[HttpGet]
		public async Task<IActionResult> GetAllSettings()
		{
			try
			{
				var settings = await _systemSettingService.GetAllSettingsAsync();
				return Ok(settings);
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}

		[HttpGet("grouped")]
		public async Task<IActionResult> GetSettingsByGroup()
		{
			try
			{
				var settings = await _systemSettingService.GetSettingsByGroupAsync();
				return Ok(settings);
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}

		[HttpGet("key/{key}")]
		public async Task<IActionResult> GetSettingByKey([FromRoute] string key)
		{
			try
			{
				var setting = await _systemSettingService.GetSettingByKeyAsync(key);
				if (setting == null)
					return NotFound($"Setting with key '{key}' not found");

				return Ok(setting);
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}

		[HttpPost]
		public async Task<IActionResult> CreateSetting([FromBody] CreateSystemSettingDto input)
		{
			if (!ModelState.IsValid)
				return BadRequest(ModelState);

			try
			{
				var userId = User.GetUserId();
				var settingId = await _systemSettingService.CreateSettingAsync(userId, input);
				return Ok(new { id = settingId });
			}
			catch (InvalidOperationException ex)
			{
				return Conflict(ex.Message);
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}

		[HttpPut("key/{key}")]
		public async Task<IActionResult> UpdateSettingByKey([FromRoute] string key, [FromBody] UpdateSystemSettingDto input)
		{
			if (!ModelState.IsValid)
				return BadRequest(ModelState);

			try
			{
				var userId = User.GetUserId();
				await _systemSettingService.UpdateSettingAsync(userId, key, input);
				return NoContent();
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(ex.Message);
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> UpdateSettingById([FromRoute] Guid id, [FromBody] UpdateSystemSettingDto input)
		{
			if (!ModelState.IsValid)
				return BadRequest(ModelState);

			try
			{
				var userId = User.GetUserId();
				await _systemSettingService.UpdateSettingByIdAsync(userId, id, input);
				return NoContent();
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(ex.Message);
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> DeleteSetting([FromRoute] Guid id)
		{
			try
			{
				var userId = User.GetUserId();
				await _systemSettingService.DeleteSettingAsync(userId, id);
				return NoContent();
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(ex.Message);
			}
			catch (Exception ex)
			{
				return StatusCode(500, ex.Message);
			}
		}
	}
}
