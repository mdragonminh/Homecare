using HSP.Core.Dtos.OcrDto;

namespace HSP.Service.Interfaces
{
    public interface IOcrService
    {
        Task<CccdDataDto> ScanCccdAsync(byte[] imageData);
        Task<string> ExtractTextAsync(byte[] imageData);
        Task<HomeItemDataDto> ScanHomeItemAsync(List<byte[]> filesBytes);
    }
}
