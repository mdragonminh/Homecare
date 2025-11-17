using HSP.Core.Abstractions.External;
using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Dtos.PaymentDto;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace HSP.Service.Implementations.External
{
	public class SePayService : ISePayService
	{
		private readonly HttpClient _httpClient;
		private readonly SePayConfigurationDto _config;

		public SePayService(IHttpClientFactory httpClientFactory, IOptions<SePayConfigurationDto> config)
		{
			_httpClient = httpClientFactory.CreateClient("SePay");
			_config = config.Value;
		}

		public async Task<SePayCreateOrderResponse> CreatePaymentOrderAsync(SePayCreateOrderRequest request)
		{
			try
			{
				
				var transactionCode = GenerateTransactionCode(request.OrderId);
				
				//generate payment instructions for customers
				return new SePayCreateOrderResponse
				{
				Success = true,
				Message = "Payment instructions generated",
				OrderId = transactionCode, // Return the HSP code, not the payment ID
				// Return bank transfer instructions URL or details
				PaymentUrl = $"{_config.ReturnUrl}?orderId={request.OrderId}&code={transactionCode}",
					QrCode = null //generate QR code for bank transfer if needed
				};
			}
			catch (Exception ex)
			{
				return new SePayCreateOrderResponse
				{
					Success = false,
					Message = $"Exception: {ex.Message}"
				};
			}
		}

		private string GenerateTransactionCode(string orderId)
		{
			// Generate a unique code that customers include in bank transfer
			var codeLength = Math.Min(8, orderId.Length);
			var code = orderId.Length >= 8 
				? orderId.Substring(orderId.Length - 8).ToUpper() 
				: orderId.ToUpper().PadLeft(8, '0');
			return $"HSP{code}";
		}

		public async Task<SePayQueryResponse> QueryPaymentStatusAsync(string orderId)
		{
			try
			{
				// Query transaction history from SePay API
				_httpClient.DefaultRequestHeaders.Clear();
				_httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");

				// SePay API endpoint to get transactions
				var url = $"https://my.sepay.vn/userapi/transactions/list?account_number={_config.AccountId}";
				var response = await _httpClient.GetAsync(url);
				var responseContent = await response.Content.ReadAsStringAsync();

				if (response.IsSuccessStatusCode)
				{
					// Parse response and find transaction matching orderId
					var result = JsonSerializer.Deserialize<SePayQueryResponse>(responseContent, new JsonSerializerOptions
					{
						PropertyNameCaseInsensitive = true
					});
					return result ?? new SePayQueryResponse { Success = false, Message = "Failed to parse response" };
				}

				return new SePayQueryResponse
				{
					Success = false,
					Message = $"SePay API error: {responseContent}"
				};
			}
			catch (Exception ex)
			{
				return new SePayQueryResponse
				{
					Success = false,
					Message = $"Exception: {ex.Message}"
				};
			}
		}

		public bool VerifyCallbackSignature(PaymentCallbackDto callback)
		{
			try
			{
				// SePay webhook verification
				if (string.IsNullOrEmpty(callback.Signature))
					return false;

				// Create verification string
				var verifyString = $"{callback.OrderId}{callback.TransactionRef}{callback.Amount}{_config.SecretKey}";
				
				using var sha256 = SHA256.Create();
				var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(verifyString));
				var computedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();
				
				return computedSignature == callback.Signature.ToLower();
			}
			catch
			{
				return false;
			}
		}

		public async Task<SePayRefundResponse> RefundPaymentAsync(SePayRefundRequest request)
		{
			try
			{
				return new SePayRefundResponse
				{
					Success = true,
					Message = "Refund recorded. Please process manual bank transfer to customer.",
					RefundId = Guid.NewGuid().ToString()
				};
			}
			catch (Exception ex)
			{
				return new SePayRefundResponse
				{
					Success = false,
					Message = $"Exception: {ex.Message}"
				};
			}
		}
	}
}
