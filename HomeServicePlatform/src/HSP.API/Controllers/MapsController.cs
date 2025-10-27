using HSP.Core.Interfaces.External;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HSP.API.Controllers
{
    [Route("api/maps")]
    [ApiController]
    [Authorize]
    public class MapsController : ControllerBase
    {
        private readonly IGeocodingService _geocodingService;

        public MapsController(IGeocodingService geocodingService)
        {
            _geocodingService = geocodingService;
        }

        [HttpGet("geocode")]
        public async Task<IActionResult> GetCoordinates([FromQuery] string address)
        {
            var coordinates = await _geocodingService.GetCoordinatesForAddressAsync(address);
            if (coordinates == null)
            {
                return NotFound("Address not found or invalid.");
            }
            return Ok(coordinates);
        }

        [HttpGet("reverse-geocode")]
        public async Task<IActionResult> GetAddress([FromQuery] double lat, [FromQuery] double lng)
        {
            var address = await _geocodingService.GetAddressForCoordinatesAsync(lat, lng);
            if (string.IsNullOrEmpty(address))
            {
                return NotFound("Could not determine address for the coordinates.");
            }
            return Ok(new { address = address });
        }
    }
}
