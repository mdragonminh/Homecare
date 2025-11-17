using HSP.Core.Abstractions.External;
using HSP.Core.Dtos.ConfigurationDto;
using HSP.Core.Dtos.PaymentDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;

namespace HSP.Service.Implementations.Internal
{
	public class PaymentService : BaseService, IPaymentService
	{
		private readonly IRepository<Payment, Guid> _paymentRepository;
		private readonly IRepository<Booking, Guid> _bookingRepository;
		private readonly ISePayService _sePayService;
		private readonly SePayConfigurationDto _sePayConfig;

		public PaymentService(
			IRepository<Payment, Guid> paymentRepository,
			IRepository<Booking, Guid> bookingRepository,
			ISePayService sePayService,
			IOptions<SePayConfigurationDto> sePayConfig,
			IUnitOfWork unitOfWork,
			IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_paymentRepository = paymentRepository;
			_bookingRepository = bookingRepository;
			_sePayService = sePayService;
			_sePayConfig = sePayConfig.Value;
		}

		public async Task<PaymentResponseDto> CreatePaymentAsync(CreatePaymentDto input, string userId)
		{
			// Validate booking exists and belongs to user
			var booking = await _bookingRepository.GetAll(b => b.Customer)
				.FirstOrDefaultAsync(b => b.Id == input.BookingId && !b.IsDeleted);

			if (booking == null)
			{
				return new PaymentResponseDto
				{
					Success = false,
					Message = _localizer["Booking not found"]
				};
			}

			// Check if booking already has a completed payment
			var existingPayment = await _paymentRepository.GetAll()
				.FirstOrDefaultAsync(p => p.BookingId == input.BookingId && 
					p.Status == PaymentStatus.Completed);

			if (existingPayment != null)
			{
				return new PaymentResponseDto
				{
					Success = false,
					Message = _localizer["Booking already has a completed payment"]
				};
			}

			// Create payment entity
			var payment = new Payment
			{
				Id = Guid.NewGuid(),
				BookingId = input.BookingId,
				Amount = input.Amount,
				PaymentMethod = input.PaymentMethod,
				Status = PaymentStatus.Pending,
				Description = input.Description ?? $"Payment for booking {booking.Id}",
				DateCreated = DateTime.UtcNow,
				DateModified = DateTime.UtcNow
			};

			await _paymentRepository.AddAsync(payment);
			await _unitOfWork.SaveChangesAsync();

			// If payment method is not cash, create SePay order
			if (input.PaymentMethod != PaymentMethod.Cash)
			{
				var sePayRequest = new SePayCreateOrderRequest
				{
					OrderId = payment.Id.ToString(),
					Amount = payment.Amount,
					Description = payment.Description,
					ReturnUrl = _sePayConfig.ReturnUrl,
					CallbackUrl = _sePayConfig.CallbackUrl,
					BuyerName = booking.Customer?.FullName,
					BuyerEmail = booking.Customer?.Email,
					BuyerPhone = booking.Customer?.PhoneNumber
				};

				var sePayResponse = await _sePayService.CreatePaymentOrderAsync(sePayRequest);

				if (sePayResponse.Success)
				{
					payment.SePayOrderId = sePayResponse.OrderId;
					payment.PaymentUrl = sePayResponse.PaymentUrl;
					payment.Status = PaymentStatus.Processing;
					payment.SePayResponse = System.Text.Json.JsonSerializer.Serialize(sePayResponse);
					payment.DateModified = DateTime.UtcNow;

					_paymentRepository.Update(payment);
					await _unitOfWork.SaveChangesAsync();

					return new PaymentResponseDto
					{
						Success = true,
						Message = _localizer["Payment created successfully"],
						Payment = MapToDto(payment),
						PaymentUrl = sePayResponse.PaymentUrl
					};
				}
				else
				{
					payment.Status = PaymentStatus.Failed;
					payment.FailureReason = sePayResponse.Message;
					payment.DateModified = DateTime.UtcNow;

					_paymentRepository.Update(payment);
					await _unitOfWork.SaveChangesAsync();

					return new PaymentResponseDto
					{
						Success = false,
						Message = _localizer["Failed to create payment: {0}", sePayResponse.Message ?? "Unknown error"]
					};
				}
			}

			// For cash payment
			return new PaymentResponseDto
			{
				Success = true,
				Message = _localizer["Payment created successfully"],
				Payment = MapToDto(payment)
			};
		}

		public async Task<PaymentDetailDto?> GetPaymentByIdAsync(Guid paymentId)
		{
			var payment = await _paymentRepository.GetAll(p => p.Booking)
				.FirstOrDefaultAsync(p => p.Id == paymentId && !p.IsDeleted);

			if (payment == null)
				return null;

			return new PaymentDetailDto
			{
				Id = payment.Id,
				BookingId = payment.BookingId,
				Amount = payment.Amount,
				PaymentMethod = payment.PaymentMethod,
				Status = payment.Status,
				TransactionId = payment.TransactionId,
				SePayOrderId = payment.SePayOrderId,
				PaidAt = payment.PaidAt,
				Description = payment.Description,
				PaymentUrl = payment.PaymentUrl,
				FailureReason = payment.FailureReason,
				RefundedAt = payment.RefundedAt,
				RefundReason = payment.RefundReason,
				DateCreated = payment.DateCreated,
				DateModified = payment.DateModified
			};
		}

		public async Task<PagedList<PaymentDto>> GetAllPaymentsAsync(PaymentFilterDto filter)
		{
			var query = _paymentRepository.GetAll(p => p.Booking);

			// Apply filters
			if (filter.BookingId.HasValue)
			{
				query = query.Where(p => p.BookingId == filter.BookingId.Value);
			}

			if (filter.Status.HasValue)
			{
				query = query.Where(p => p.Status == filter.Status.Value);
			}

			if (filter.PaymentMethod.HasValue)
			{
				query = query.Where(p => p.PaymentMethod == filter.PaymentMethod.Value);
			}

			if (filter.FromDate.HasValue)
			{
				query = query.Where(p => p.DateCreated >= filter.FromDate.Value);
			}

			if (filter.ToDate.HasValue)
			{
				query = query.Where(p => p.DateCreated <= filter.ToDate.Value);
			}

			if (!string.IsNullOrEmpty(filter.SearchTerm))
			{
				query = query.Where(p => 
					(p.Description != null && p.Description.Contains(filter.SearchTerm)) ||
					(p.TransactionId != null && p.TransactionId.Contains(filter.SearchTerm)) ||
					(p.SePayOrderId != null && p.SePayOrderId.Contains(filter.SearchTerm)));
			}

			// Order by created date descending
			if (string.IsNullOrWhiteSpace(filter.OrderBy))
			{
				query = query.OrderByDescending(p => p.DateCreated);
			}

			var dtoQuery = query.Select(p => new PaymentDto
			{
				Id = p.Id,
				BookingId = p.BookingId,
				Amount = p.Amount,
				PaymentMethod = p.PaymentMethod,
				Status = p.Status,
				TransactionId = p.TransactionId,
				SePayOrderId = p.SePayOrderId,
				PaidAt = p.PaidAt,
				Description = p.Description,
				DateCreated = p.DateCreated,
				DateModified = p.DateModified
			});

			return await dtoQuery.ToPagedListAsync(filter);
		}

		public async Task<List<PaymentDto>> GetPaymentsByBookingIdAsync(Guid bookingId)
		{
			var payments = await _paymentRepository.GetAll()
				.Where(p => p.BookingId == bookingId && !p.IsDeleted)
				.OrderByDescending(p => p.DateCreated)
				.Select(p => MapToDto(p))
				.ToListAsync();

			return payments;
		}

		public async Task<bool> HandleSePayWebhookAsync(SePayWebhookDto webhook)
		{
			try
			{
				// Validate webhook input
				if (webhook == null)
				{
					return false;
				}

				// Extract payment code from content
				var content = webhook.Content?.Trim() ?? "";
								
				// Try to find payment code (HSP + 8 digits/chars)
				var paymentCode = ExtractPaymentCode(content);
				
				if (string.IsNullOrEmpty(paymentCode))
				{
					// No payment code found, ignore this transaction
					return false;
				}
				// Find payment by SePayOrderId (payment code)
				var payment = await _paymentRepository.GetAll()
					.FirstOrDefaultAsync(p => p.SePayOrderId == paymentCode && !p.IsDeleted);

				if (payment == null)
				{
					// No matching payment found
					return false;
				}

				// Check if already processed
				if (payment.Status == PaymentStatus.Completed)
				{
					return true; // Already processed
				}

			// Verify amount matches
			if (payment.Amount != webhook.TransferAmount)
			{
				var errorMsg = $"Amount mismatch: Expected {payment.Amount}, Got {webhook.TransferAmount}";
				
				payment.Status = PaymentStatus.Failed;
				payment.FailureReason = errorMsg;
				payment.DateModified = DateTime.UtcNow;
				_paymentRepository.Update(payment);
				await _unitOfWork.SaveChangesAsync();
				return false;
			}

			// Update payment status - only update necessary fields
			payment.Status = PaymentStatus.Completed;
			payment.PaidAt = DateTime.UtcNow;
			payment.TransactionId = webhook.Id.ToString();
			payment.SePayTransactionRef = webhook.ReferenceCode ?? webhook.Id.ToString();
			payment.SePayResponse = System.Text.Json.JsonSerializer.Serialize(webhook);
			payment.DateModified = DateTime.UtcNow;

			_paymentRepository.Update(payment);
			await _unitOfWork.SaveChangesAsync();

			return true;
		}
		catch (Exception)
		{
			return false;
		}
	}		private string? ExtractPaymentCode(string content)
		{
			if (string.IsNullOrEmpty(content))
				return null;

			// Look for pattern: HSP followed by 8 characters
			var match = System.Text.RegularExpressions.Regex.Match(content, @"HSP[A-Za-z0-9]{8}");
			if (match.Success)
			{
				return match.Value;
			}

			return null;
		}

		public async Task<bool> HandlePaymentCallbackAsync(PaymentCallbackDto callback)
		{
			// Verify signature
			if (!_sePayService.VerifyCallbackSignature(callback))
			{
				return false;
			}

			// Find payment by order ID
			if (!Guid.TryParse(callback.OrderId, out var paymentId))
			{
				return false;
			}

			var payment = await _paymentRepository.GetByIdAsync(paymentId);
			if (payment == null)
			{
				return false;
			}

			// Update payment status based on callback
			if (callback.Status?.ToLower() == "success" || callback.Status?.ToLower() == "completed")
			{
				payment.Status = PaymentStatus.Completed;
				payment.PaidAt = DateTime.UtcNow;
				payment.TransactionId = callback.TransactionRef;
				payment.SePayTransactionRef = callback.TransactionRef;
			}
			else if (callback.Status?.ToLower() == "failed")
			{
				payment.Status = PaymentStatus.Failed;
				payment.FailureReason = callback.Message;
			}
			else if (callback.Status?.ToLower() == "cancelled")
			{
				payment.Status = PaymentStatus.Cancelled;
			}

			payment.DateModified = DateTime.UtcNow;
			_paymentRepository.Update(payment);
			await _unitOfWork.SaveChangesAsync();

			return true;
		}

		public async Task<bool> UpdatePaymentStatusAsync(UpdatePaymentStatusDto input)
		{
			var payment = await _paymentRepository.GetByIdAsync(input.PaymentId);
			if (payment == null)
			{
				return false;
			}

			payment.Status = input.Status;
			if (!string.IsNullOrEmpty(input.TransactionId))
			{
				payment.TransactionId = input.TransactionId;
			}
			if (!string.IsNullOrEmpty(input.FailureReason))
			{
				payment.FailureReason = input.FailureReason;
			}
			if (input.Status == PaymentStatus.Completed)
			{
				payment.PaidAt = DateTime.UtcNow;
			}

			payment.DateModified = DateTime.UtcNow;
			_paymentRepository.Update(payment);
			await _unitOfWork.SaveChangesAsync();

			return true;
		}

		public async Task<bool> RefundPaymentAsync(RefundPaymentDto input, string userId)
		{
			var payment = await _paymentRepository.GetByIdAsync(input.PaymentId);
			if (payment == null || payment.Status != PaymentStatus.Completed)
			{
				return false;
			}

			// Request refund from SePay
			if (payment.PaymentMethod != PaymentMethod.Cash && !string.IsNullOrEmpty(payment.SePayTransactionRef))
			{
				var refundRequest = new SePayRefundRequest
				{
					OrderId = payment.SePayOrderId ?? payment.Id.ToString(),
					TransactionRef = payment.SePayTransactionRef,
					Amount = payment.Amount,
					Reason = input.Reason
				};

				var refundResponse = await _sePayService.RefundPaymentAsync(refundRequest);
				if (!refundResponse.Success)
				{
					return false;
				}
			}

			payment.Status = PaymentStatus.Refunded;
			payment.RefundedAt = DateTime.UtcNow;
			payment.RefundReason = input.Reason;
			payment.DateModified = DateTime.UtcNow;

			_paymentRepository.Update(payment);
			await _unitOfWork.SaveChangesAsync();

			return true;
		}

		public async Task<PaymentDetailDto?> QueryPaymentStatusAsync(Guid paymentId)
		{
			var payment = await _paymentRepository.GetByIdAsync(paymentId);
			if (payment == null || string.IsNullOrEmpty(payment.SePayOrderId))
			{
				return await GetPaymentByIdAsync(paymentId);
			}

			// Query status from SePay
			var queryResponse = await _sePayService.QueryPaymentStatusAsync(payment.SePayOrderId);
			
			if (queryResponse.Success)
			{
				// Update local payment status
				if (queryResponse.Status?.ToLower() == "completed" && payment.Status != PaymentStatus.Completed)
				{
					payment.Status = PaymentStatus.Completed;
					payment.PaidAt = queryResponse.PaidAt ?? DateTime.UtcNow;
					payment.TransactionId = queryResponse.TransactionRef;
					payment.SePayTransactionRef = queryResponse.TransactionRef;
					payment.DateModified = DateTime.UtcNow;

					_paymentRepository.Update(payment);
					await _unitOfWork.SaveChangesAsync();
				}
			}

			return await GetPaymentByIdAsync(paymentId);
		}

		private static PaymentDto MapToDto(Payment payment)
		{
			return new PaymentDto
			{
				Id = payment.Id,
				BookingId = payment.BookingId,
				Amount = payment.Amount,
				PaymentMethod = payment.PaymentMethod,
				Status = payment.Status,
				TransactionId = payment.TransactionId,
				SePayOrderId = payment.SePayOrderId,
				PaidAt = payment.PaidAt,
				Description = payment.Description,
				DateCreated = payment.DateCreated,
				DateModified = payment.DateModified
			};
		}
	}
}
