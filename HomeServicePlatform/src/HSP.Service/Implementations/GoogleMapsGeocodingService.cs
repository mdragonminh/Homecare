using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Dtos.MapDto;
using HSP.Core.Interfaces.External;
using Microsoft.Extensions.Options;
using System.Text.Json;
using System.Globalization;

namespace HSP.Service.Implementations
{
	public class GoogleMapsGeocodingService : IGeocodingService
	{
		private readonly IHttpClientFactory _httpClientFactory;
		private readonly GoogleMapConfigurationDto _googleMapConfig;

		public GoogleMapsGeocodingService(IHttpClientFactory httpClientFactory, IOptions<GoogleMapConfigurationDto> options)
		{
			_httpClientFactory = httpClientFactory;
			_googleMapConfig = options.Value;
		}

		public async Task<CoordinatesDto?> GetCoordinatesForAddressAsync(string address)
		{
			var apiKey = _googleMapConfig.ApiKey;
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

        public async Task<string?> GetAddressForCoordinatesAsync(double latitude, double longitude)
        {
            var apiKey = _googleMapConfig.ApiKey;
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new InvalidOperationException("Google Maps API Key is not configured.");
            }

            var client = _httpClientFactory.CreateClient("GoogleMaps");
            var requestUrl = $"geocode/json?latlng={latitude.ToString(CultureInfo.InvariantCulture)}," +
				$"{longitude.ToString(CultureInfo.InvariantCulture)}&key={apiKey}"; 
			var response = await client.GetAsync(requestUrl);

            if (!response.IsSuccessStatusCode) return null;

            var jsonResponse = await response.Content.ReadAsStringAsync();
            var geocodingResponse = JsonSerializer.Deserialize<GeocodingResponseDto>(jsonResponse);

            var formattedAddress = geocodingResponse?.Results?.FirstOrDefault()?.FormattedAddress;

            return formattedAddress;
        }
    }
}
