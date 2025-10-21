using HSP.Core.Dtos.AppUserDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;

namespace HSP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CustomerProfileController : ControllerBase
    {
        private readonly ICustomerProfileService _customerProfileService;

        public CustomerProfileController(ICustomerProfileService customerProfileService)
        {
            _customerProfileService = customerProfileService;
        }

        [HttpGet]
        public async Task<ActionResult> GetCustomers([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] string? searchTerm = null)
        {
            try
            {
                var customers = await _customerProfileService.GetCustomersAsync(pageNumber, pageSize, searchTerm);
                return Ok(customers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("my-profile")]
        public async Task<ActionResult<AppUserDto>> GetMyProfile()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User not authenticated");
                }

                var profile = await _customerProfileService.GetCustomerByUserIdAsync(userId);
                return Ok(profile);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbidden(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AppUserDto>> GetProfileById(Guid id)
        {
            try
            {
                var profile = await _customerProfileService.GetCustomerByIdAsync(id);
                return Ok(profile);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbidden(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("my-profile")]
        public async Task<ActionResult<AppUserDto>> UpdateMyProfile([FromBody] UpdateAppUserDto updateDto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User not authenticated");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var updatedProfile = await _customerProfileService.UpdateCustomerAsync(userId, updateDto);
                return Ok(updatedProfile);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbidden(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("request-email-change")]
        public async Task<ActionResult<EmailChangeResponseDto>> RequestEmailChange([FromBody] RequestEmailChangeDto requestDto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User not authenticated");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _customerProfileService.RequestEmailChangeAsync(userId, requestDto.NewEmail);

                if (result.Success)
                {
                    return Ok(result);
                }
                else
                {
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("confirm-email-change")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmEmailChange(string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest("Token is required");
                }

                // Decode token để lấy userId
                var tokenBytes = Convert.FromBase64String(token);
                var tokenString = Encoding.UTF8.GetString(tokenBytes);
                var tokenParts = tokenString.Split(':');

                if (tokenParts.Length != 3)
                {
                    return BadRequest("Invalid token format");
                }

                var userId = tokenParts[0];
                var result = await _customerProfileService.ConfirmEmailChangeAsync(userId, token);

                if (result.Success)
                {
                    // Chuyển hướng về frontend với thông báo thành công
                    var frontendUrl = "http://localhost:5173"; // Có thể đọc từ config
                    return Redirect($"{frontendUrl}/confirm-email-change?token={token}&status=success&message={Uri.EscapeDataString(result.Message)}");
                }
                else
                {
                    // Chuyển hướng về frontend với thông báo lỗi
                    var frontendUrl = "http://localhost:5173";
                    return Redirect($"{frontendUrl}/confirm-email-change?token={token}&status=error&message={Uri.EscapeDataString(result.Message)}");
                }
            }
            catch (Exception)
            {
                var frontendUrl = "http://localhost:5173";
                return Redirect($"{frontendUrl}/confirm-email-change?status=error&message={Uri.EscapeDataString("Có lỗi xảy ra khi xác nhận email")}");
            }
        }

        [HttpPost("confirm-email-change")]
        public async Task<ActionResult<EmailChangeResponseDto>> ConfirmEmailChangeApi([FromBody] ConfirmEmailChangeDto confirmDto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User not authenticated");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _customerProfileService.ConfirmEmailChangeAsync(userId, confirmDto.Token);

                if (result.Success)
                {
                    return Ok(result);
                }
                else
                {
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("debug")]
        public async Task<ActionResult> GetDebugInfo()
        {
            try
            {
                var debugInfo = await _customerProfileService.GetDebugInfoAsync();
                return Ok(debugInfo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private ActionResult Forbidden(string message)
        {
            return StatusCode(403, message);
        }
    }
}
