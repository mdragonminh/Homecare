using HSP.Core.Abstractions.External;
using HSP.Core.Constans;
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
        private readonly IRepository<ChatConversation, Guid> _chatConversation;
        private readonly IRepository<BookingEquipment, Guid> _bookingEquipmentRepository;
        private readonly IBookingService _bookingService;
        public PaymentService(
            IRepository<Payment, Guid> paymentRepository,
            IRepository<Booking, Guid> bookingRepository,
            ISePayService sePayService,
            IRepository<ChatConversation,Guid> chatConversation,
            IOptions<SePayConfigurationDto> sePayConfig,
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResource> localizer,
            IRepository<BookingEquipment, Guid> bookingEquipmentRepository,
            IBookingService bookingService) : base(unitOfWork, localizer)
        {
            _paymentRepository = paymentRepository;
            _bookingRepository = bookingRepository;
            _sePayService = sePayService;
            _sePayConfig = sePayConfig.Value;
            _chatConversation = chatConversation;
            _bookingEquipmentRepository = bookingEquipmentRepository;
            _bookingService = bookingService;
        }

        public async Task<PaymentResponseDto> CreatePaymentAsync(CreatePaymentDto input, string userId)
        {
            // Validate booking exists and belongs to user
            var booking = await _bookingRepository.GetAll(b => b.Customer)
                .Include(x => x.Technician)
                .FirstOrDefaultAsync(b => b.Id == input.BookingId && !b.IsDeleted);

            if (booking == null)
            {
                return new PaymentResponseDto
                {
                    Success = false,
                    Message = _localizer["Booking not found"]
                };
            }
            if (booking.Latitude == null || booking.Longitude == null ||
                booking.Technician?.Latitude == null || booking.Technician?.Longitude == null)
            {
                return new PaymentResponseDto
                {
                    Success = false,
                    Message = _localizer["Không thể xác định vị trí của khách hoặc kỹ thuật viên"]
                };
            }

            double distance = CalculateDistance(
                booking.Latitude,
                booking.Longitude,
                booking.Technician.Latitude,
                booking.Technician.Longitude
            );
            if (distance > 0.5)
            {
                return new PaymentResponseDto
                {
                    Success = false,
                    Message = _localizer["KTV không ở tại vị trí làm việc"]
                };
            }

            // Check if booking already has a completed service payment
            var existingServicePayment = await _paymentRepository.GetAll()
                .FirstOrDefaultAsync(p => p.BookingId == input.BookingId &&
                    p.Type == PaymentType.Service &&
                    p.Status == PaymentStatus.Completed);

            if (existingServicePayment != null)
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
                    var isClosed = await _chatConversation.GetAll().FirstOrDefaultAsync(x => x.BookingId == booking.Id);
                    if (isClosed != null)
                    {
                        isClosed.IsClosed = true;
                        await _unitOfWork.SaveChangesAsync();
                    }
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

        public async Task<PaymentResponseDto> CreateEquipmentPaymentAsync(CreateEquipmentPaymentDto input, string userId)
        {
            // Validate Booking exists
            var booking = await _bookingRepository.GetAll(b => b.Customer)
                .FirstOrDefaultAsync(b => b.Id == input.BookingId && !b.IsDeleted);

            if (booking == null) return new PaymentResponseDto { Success = false, Message = _localizer["Booking not found"] };

            // Validate Items: Phải tồn tại, thuộc booking này, và đang ở trạng thái Submitted
            var itemsToPay = await _bookingEquipmentRepository.GetAll() // Cần Inject _bookingEquipmentRepository vào PaymentService
                .Where(be => input.BookingEquipmentIds.Contains(be.Id)
                             && be.BookingId == input.BookingId
                             && be.Status == BookingEquipmentStatus.Submitted)
                .ToListAsync();

            if (itemsToPay.Count != input.BookingEquipmentIds.Count)
            {
                return new PaymentResponseDto { Success = false, Message = _localizer["Một số thiết bị không hợp lệ hoặc sai trạng thái"] };
            }

            // Tính tổng tiền thiết bị
            decimal equipmentTotal = itemsToPay.Sum(x => x.Quantity * x.UnitPrice);
            
            // Phí vận chuyển cố định 50,000 VND cho mỗi lần gửi thiết bị
            decimal shippingFee = 50000m;
            decimal totalAmount = equipmentTotal + shippingFee;

            // Create Payment record
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                BookingId = input.BookingId,
                Amount = totalAmount,
                ShippingFee = shippingFee,
                PaymentMethod = input.PaymentMethod,
                Status = PaymentStatus.Pending,
                Type = PaymentType.Equipment, // Đánh dấu là thanh toán Equipment
                Description = input.Description ?? $"Payment for equipments: {string.Join(", ", itemsToPay.Select(x => x.EquipmentId))}",
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow
            };

            // Link PaymentId vào các BookingEquipment ngay lập tức (để tracking)
            foreach (var item in itemsToPay)
            {
                item.PaymentId = payment.Id;
                _bookingEquipmentRepository.Update(item); // Cần update repository này
            }

            await _paymentRepository.AddAsync(payment);
            await _unitOfWork.SaveChangesAsync();

            // Xử lý SePay (Logic tương tự hàm cũ nhưng object Payment khác)
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

            return new PaymentResponseDto
            {
                Success = true,
                Message = _localizer["Payment created successfully"],
                Payment = MapToDto(payment)
                // PaymentUrl...
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
        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var dLat = (lat2 - lat1) * GeoConstants.DegreeToRadian;
            var dLon = (lon2 - lon1) * GeoConstants.DegreeToRadian;

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                            Math.Cos(lat1 * GeoConstants.DegreeToRadian) * Math.Cos(lat2 * GeoConstants.DegreeToRadian) *
                            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return GeoConstants.EarthRadiusKm * c;
        }
        public async Task<PagedList<PaymentDto>> GetAllPaymentsAsync(PaymentFilterDto filter)
        {
            var query = _paymentRepository.GetAll(p => p.Booking);

            // Apply filters
            if (filter.BookingId.HasValue)
            {
                query = query.Where(p => p.BookingId == filter.BookingId.Value);
            }

            if (filter.CustomerId.HasValue)
            {
                query = query.Where(p => p.Booking.CustomerId == filter.CustomerId.Value);
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
                ShippingFee = p.ShippingFee,
                PaymentMethod = p.PaymentMethod,
                Status = p.Status,
                Type = p.Type,
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
                if (webhook == null) return false;

                var content = webhook.Content?.Trim() ?? "";
                var paymentCode = ExtractPaymentCode(content);

                if (string.IsNullOrEmpty(paymentCode)) return false;

                // Include BookingEquipment để update sau này
                var payment = await _paymentRepository.GetAll()
                    .Include(p => p.BookingEquipments)
                    .FirstOrDefaultAsync(p => p.SePayOrderId == paymentCode && !p.IsDeleted);

                if (payment == null) return false;

                // Case 1: Đã xử lý rồi -> Return True luôn (Idempotency)
                if (payment.Status == PaymentStatus.Completed)
                {
                    return true;
                }

                // Verify amount
                if (payment.Amount != webhook.TransferAmount)
                {
                    payment.Status = PaymentStatus.Failed;
                    payment.FailureReason = $"Amount mismatch: Expected {payment.Amount}, Got {webhook.TransferAmount}";
                    payment.DateModified = DateTime.UtcNow;
                    _paymentRepository.Update(payment);
                    await _unitOfWork.SaveChangesAsync();
                    return false;
                }

                // === CẬP NHẬT TRẠNG THÁI THANH TOÁN ===
                payment.Status = PaymentStatus.Completed;
                payment.PaidAt = DateTime.UtcNow;
                payment.TransactionId = webhook.Id.ToString();
                payment.SePayTransactionRef = webhook.ReferenceCode ?? webhook.Id.ToString();
                payment.SePayResponse = System.Text.Json.JsonSerializer.Serialize(webhook);
                payment.DateModified = DateTime.UtcNow;

                // === LOGIC MỚI: XỬ LÝ THEO LOẠI THANH TOÁN ===
                if (payment.Type == PaymentType.Equipment)
                {
                    // Nếu là thanh toán Equipment -> Chỉ update trạng thái các món đồ
                    // (Lưu ý: Dùng _bookingEquipmentRepository để đảm bảo tracking change)
                    var equipments = await _bookingEquipmentRepository.GetAll()
                        .Where(be => be.PaymentId == payment.Id).ToListAsync();

                    foreach (var item in equipments)
                    {
                        if (item.Status == BookingEquipmentStatus.Submitted)
                        {
                            item.Status = BookingEquipmentStatus.Paid;
                            _bookingEquipmentRepository.Update(item);
                        }
                    }
                    // KHÔNG update Booking.Status = Completed ở đây vì thợ vẫn đang làm
                }
                else
                {
                }

                _paymentRepository.Update(payment);
                await _unitOfWork.SaveChangesAsync();

                if (payment.BookingId != Guid.Empty)
                {
                    await _bookingService.TryCompleteBookingAsync(payment.BookingId);
                }

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
        private string? ExtractPaymentCode(string content)
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

            if (!Guid.TryParse(callback.OrderId, out var paymentId))
            {
                return false;
            }

            var payment = await _paymentRepository.GetByIdAsync(paymentId);
            if (payment == null) return false;

            // Update payment status based on callback
            if (callback.Status?.ToLower() == "success" || callback.Status?.ToLower() == "completed")
            {
                // Kiểm tra nếu đã completed rồi thì thôi
                if (payment.Status == PaymentStatus.Completed) return true;

                payment.Status = PaymentStatus.Completed;
                payment.PaidAt = DateTime.UtcNow;
                payment.TransactionId = callback.TransactionRef;
                payment.SePayTransactionRef = callback.TransactionRef;

                // === LOGIC MỚI ===
                if (payment.Type == PaymentType.Equipment)
                {
                    // Update Equipment status
                    var equipments = await _bookingEquipmentRepository.GetAll()
                        .Where(be => be.PaymentId == payment.Id).ToListAsync();

                    foreach (var item in equipments)
                    {
                        if (item.Status == BookingEquipmentStatus.Submitted)
                        {
                            item.Status = BookingEquipmentStatus.Paid;
                            _bookingEquipmentRepository.Update(item);
                        }
                    }
                }
                else
                {
                }
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

            if (payment.BookingId != Guid.Empty && payment.Status == PaymentStatus.Completed)
            {
                await _bookingService.TryCompleteBookingAsync(payment.BookingId);
            }

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

            if (payment.BookingId != Guid.Empty && input.Status == PaymentStatus.Completed)
            {
                await _bookingService.TryCompleteBookingAsync(payment.BookingId);
            }

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

                    var booking = await _bookingRepository.GetByIdAsync(payment.BookingId);
                    if (booking != null && booking.Status != BookingStatus.Completed
                    && booking.Status != BookingStatus.Cancelled && booking.Status != BookingStatus.Pending)
                    {
                        booking.Status = BookingStatus.Completed;
                        booking.DateModified = DateTime.UtcNow;
                        _bookingRepository.Update(booking);
                    }

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
                ShippingFee = payment.ShippingFee,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status,
                Type = payment.Type,
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
