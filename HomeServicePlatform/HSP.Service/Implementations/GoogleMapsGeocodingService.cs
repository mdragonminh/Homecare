using HSP.Core.Dtos.MapDto;
using HSP.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Text.Json;

namespace HSP.Service.Implementations
{
	public class GoogleMapsGeocodingService : IGeocodingService
	{
		private readonly IHttpClientFactory _httpClientFactory;
		private readonly IConfiguration _configuration;

		public GoogleMapsGeocodingService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
		{
			_httpClientFactory = httpClientFactory;
			_configuration = configuration;
		}

		public async Task<CoordinatesDto?> GetCoordinatesForAddressAsync(string address)
		{
			var apiKey = _configuration["GoogleMaps:ApiKey"];
			if (string.IsNullOrEmpty(apiKey))
			{
				throw new InvalidOperationException("Google Maps API Key is not configured.");
			}

			var client = _httpClientFactory.CreateClient("GoogleMaps");
			var requestUrl = $"geocode/json?address={Uri.EscapeDataString(address)}&key={apiKey}";

			var response = await client.GetAsync(requestUrl);

			if (!response.IsSuccessStatusCode) return null;

			var jsonResponse = await response.Content.ReadAsStringAsync();
			var geocodingResponse = JsonSerializer.Deserialize<GeocodingResponseDto>(jsonResponse);

			var location = geocodingResponse?.Results?.FirstOrDefault()?.Geometry?.Location;
			if (location == null) return null;

			return new CoordinatesDto { Latitude = location.Lat, Longitude = location.Lng };
		}
	}
}
