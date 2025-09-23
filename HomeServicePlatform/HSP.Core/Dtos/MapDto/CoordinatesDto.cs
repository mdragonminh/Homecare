using System.Text.Json.Serialization;

namespace HSP.Core.Dtos.MapDto
{
	public class CoordinatesDto
	{
		public double Latitude { get; set; }
		public double Longitude { get; set; }
	}
	public class GeocodingResponseDto
	{
		[JsonPropertyName("results")]
		public List<GeocodingResultDto> Results { get; set; }
		[JsonPropertyName("status")]
		public string Status { get; set; }
	}
	public class GeocodingResultDto
	{
		[JsonPropertyName("geometry")]
		public GeometryDto Geometry { get; set; }
	}
	public class GeometryDto
	{
		[JsonPropertyName("location")]
		public LocationDto Location { get; set; }
	}
	public class LocationDto
	{
		[JsonPropertyName("lat")]
		public double Lat { get; set; }
		[JsonPropertyName("lng")]
		public double Lng { get; set; }
	}
}
