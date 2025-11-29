using HSP.Core.Dtos.BookingDto;
using HSP.Core.Dtos.PaymentDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations.Internal
{
    public class BookingService : BaseService, IBookingService
    {
        private readonly IRepository<Booking, Guid> _bookingRepository;
        private readonly IRepository<BookingItem, Guid> _bookingItemRepository;
        private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;
        private readonly IRepository<Core.Entities.Service, Guid> _serviceRepository;
        private readonly IRepository<ChatConversation, Guid> _conversationRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRedisCacheService _redisCacheService;
        private readonly IEmailService _emailService;
        public BookingService(
                IRepository<Booking, Guid> bookingRepository,
                IRepository<BookingItem, Guid> bookingItemRepository,
                IRepository<TechnicianProfile, Guid> technicianRepository,
                IRepository<Core.Entities.Service, Guid> serviceRepository,
                IUserRepository userRepository,
                IRedisCacheService redisCacheService,
                IRepository<ChatConversation, Guid> conversationRepository,
                IUnitOfWork unitOfWork,
                IStringLocalizer<SharedResource> localizer,
                IEmailService emailService) : base(unitOfWork, localizer)
        {
            _bookingRepository = bookingRepository;
            _bookingItemRepository = bookingItemRepository;
            _technicianRepository = technicianRepository;
            _serviceRepository = serviceRepository;
            _userRepository = userRepository;
            _redisCacheService = redisCacheService;
            _conversationRepository = conversationRepository;
            _emailService = emailService;
        }

        public async Task<PagedList<BookingDto>> GetAllBookingsAsync(BookingInput input)
        {
            var query = _bookingRepository.GetAll(
                    b => b.Customer
            );

            // Apply filters
            if (!string.IsNullOrEmpty(input.SearchTerm))
            {
                query = query.Where(b =>
                        (b.Customer != null && b.Customer.UserName != null &&
                         b.Customer.UserName.Contains(input.SearchTerm)) ||
                        (b.ProblemDescription != null && b.ProblemDescription.Contains(input.SearchTerm)));
            }

            if (input.Status.HasValue)
            {
                query = query.Where(b => b.Status == input.Status.Value);
            }

            if (input.TechnicianId.HasValue)
            {
                query = query.Where(b => b.TechnicianId == input.TechnicianId.Value);
            }

            if (input.CustomerId.HasValue)
            {
                query = query.Where(b => b.CustomerId == input.CustomerId.Value);
            }

            if (input.FromDate.HasValue)
            {
                query = query.Where(b => b.DesiredDate >= input.FromDate.Value);
            }

            if (input.ToDate.HasValue)
            {
                query = query.Where(b => b.DesiredDate <= input.ToDate.Value);
            }

            // Order by created date descending
            if (string.IsNullOrWhiteSpace(input.OrderBy))
            {
                query = query.OrderByDescending(b => b.DateCreated);
            }

            var dtoQuery = query.Select(b => new BookingDto
            {
                Id = b.Id,
                CustomerProfileId = b.CustomerId,
                TechnicianId = b.TechnicianId,
                DesiredDate = b.DesiredDate.Value,
                ProblemDescription = b.ProblemDescription,
                Status = b.Status,
                DateCompleted = b.DateCompleted,
                DateCreated = b.DateCreated,
                DateModified = b.DateModified,
                Customer = b.Customer != null ? new Core.Dtos.CustomerProfileDto.CustomerProfileDto
                {
                    Id = b.Customer.Id,
                    UserId = b.CustomerId,
                    FullName = b.Customer.FullName,
                    Email = b.Customer.Email ?? "",
                    PhoneNumber = b.Customer.PhoneNumber ?? ""
                } : null,
                Technician = b.Technician != null ? new Core.Dtos.TechnicianProfileDto.TechnicianProfileResponseDto
                {
                    Id = b.Technician.Id,
                    UserId = b.Technician.UserId,
                    Email = b.Technician.User != null ? b.Technician.User.Email : null,
                    PhoneNumber = b.Technician.User != null ? b.Technician.User.PhoneNumber : null
                } : null,
                Feedbacks = b.Feedbacks.Select(f => new BookingFeedbackResponseDto
                {
                    BookingId = f.BookingId,
                    Rating = f.Rating,
                    Comment = f.Comment,
                    Source = f.Source 
                }).ToList(),
                Cancellation = b.Cancellation != null ? new BookingCancellationResponseDto
                {
                    BookingId = b.Cancellation.BookingId,
                    Reason = b.Cancellation.Reason,
                    CancelledBy = b.Cancellation.CancelledBy,
                    CancelledAt = b.Cancellation.CancelledAt
                } : null,
                TotalPrice = _bookingItemRepository.GetAll()
                                .Where(item => item.BookingId == b.Id && !item.IsDeleted)
                                .Sum(item => item.Price)
            });

            var pagedResult = await dtoQuery.ToPagedListAsync(input);

            return pagedResult;
        }

        public async Task<BookingDetailDto?> GetBookingDetailAsync(Guid bookingId)
        {
            var booking = await _bookingRepository.GetAll(
                    b => b.Customer,
                    b => b.Payments,
                    b => b.Feedbacks
            ).FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
                return null;

            // Load technician separately if exists
            TechnicianProfile? technician = null;
            if (booking.TechnicianId.HasValue)
            {
                technician = await _technicianRepository.GetAll(t => t.User)
                        .FirstOrDefaultAsync(t => t.Id == booking.TechnicianId.Value);
            }

            // Load booking items with services
            var bookingItems = await _bookingItemRepository.GetAll(i => i.Service)
                .Where(i => i.BookingId == bookingId && !i.IsDeleted)
                .ToListAsync();

            // Calculate total price from items
            var totalPrice = bookingItems.Sum(i => i.Price);

            var customerRatings = await _bookingRepository.GetAll()
                .Where(b => b.CustomerId == booking.CustomerId && b.Id != bookingId) 
                .SelectMany(b => b.Feedbacks)
                .Where(f => f.Source == FeedbackSource.Technician) 
                .Select(f => f.Rating)
                .ToListAsync();

            double? avgRating = null;
            if (customerRatings.Any())
            {
                avgRating = Math.Round(customerRatings.Average(), 1); 
            }

            return new BookingDetailDto
            {
                Id = booking.Id,
                CustomerProfileId = booking.CustomerId,
                TechnicianId = booking.TechnicianId,
                DesiredDate = booking.DesiredDate.Value,
                ProblemDescription = booking.ProblemDescription,
                Status = booking.Status,
                DateCompleted = booking.DateCompleted,
                DateCreated = booking.DateCreated,
                DateModified = booking.DateModified,
                CustomerName = booking.Customer?.FullName ?? booking.Customer?.UserName,
                CustomerEmail = booking.Customer?.Email,
                CustomerPhone = booking.Customer?.PhoneNumber,
                TechnicianName = technician?.User?.UserName,
                TechnicianEmail = technician?.User?.Email,
                TechnicianPhone = technician?.User?.PhoneNumber,
                CustomerAverageRating = avgRating,
                CustomerRatingCount = customerRatings.Count,
                Items = bookingItems.Select(i => new BookingItemDto
                {
                    Id = i.Id,
                    ServiceId = i.ServiceId,
                    ServiceName = i.Service?.Name,
                    Price = i.Price
                }).ToList(),
                TotalPrice = totalPrice,
                Feedbacks = booking.Feedbacks.Select(f => new BookingFeedbackResponseDto
                {
                    BookingId = f.BookingId,
                    Rating = f.Rating,
                    Comment = f.Comment,
                    Source = f.Source 
                }).ToList(),
                Cancellation = booking.Cancellation != null ? new BookingCancellationResponseDto
                {
                    BookingId = booking.Cancellation.BookingId,
                    Reason = booking.Cancellation.Reason,
                    CancelledBy = booking.Cancellation.CancelledBy,
                    CancelledAt = booking.Cancellation.CancelledAt
                } : null,
                Payments = booking.Payments.Select(p => new PaymentDto
                {
                    Id = p.Id,
                    BookingId = p.BookingId,
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod,
                    Status = p.Status,
                    TransactionId = p.TransactionId,
                    PaidAt = p.PaidAt,
                    DateCreated = p.DateCreated
                }).OrderByDescending(p => p.DateCreated).ToList()
            };
        }
        public async Task<bool> UpdateBookingStatusAsync(UpdateBookingStatusDto input, string technicianUserId)
        {
            var booking = await _bookingRepository.GetByIdAsync(input.BookingId);
            if (booking == null)
                return false;

            // Verify technician is assigned to this booking
            var technicianProfile = await _technicianRepository.GetAll(t => t.User)
                    .FirstOrDefaultAsync(t => t.User.Id.ToString() == technicianUserId);

            if (technicianProfile == null || booking.TechnicianId != technicianProfile.Id)
                return false;

            booking.Status = input.Status;
            booking.DateModified = DateTime.UtcNow;

            if (input.Status == BookingStatus.Completed)
            {
                booking.DateCompleted = DateTime.UtcNow;
            }

            _bookingRepository.Update(booking);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> CancelBookingAsync(CancelBookingDto input, string userId)
        {
            var booking = await _bookingRepository.GetAll(b => b.Customer, b => b.Items)
                    .FirstOrDefaultAsync(b => b.Id == input.BookingId);

            if (booking == null)
                return false;

            var technicianProfile = await _technicianRepository.GetAll(t => t.User)
                    .FirstOrDefaultAsync(t => t.User.Id.ToString() == userId);

            if (technicianProfile == null || booking.TechnicianId != technicianProfile.Id)
                return false;

            if (booking.Status == BookingStatus.Completed || booking.Status == BookingStatus.Cancelled)
                return false;

            booking.Status = BookingStatus.Cancelled;
            booking.DateModified = DateTime.UtcNow;

            booking.Cancellation = new BookingCancellation
            {
                BookingId = booking.Id,
                Reason = input.Reason,
                CancelledBy = technicianProfile.Id,
                CancelledAt = DateTime.UtcNow
            };

            _bookingRepository.Update(booking);
            await _unitOfWork.SaveChangesAsync();

            if (booking.Customer != null && !string.IsNullOrEmpty(booking.Customer.Email))
            {
                try
                {
                    var serviceName = booking.Items?.FirstOrDefault()?.Service?.Name ?? "Dịch vụ";

                    var emailDto = new EmailDto
                    {
                        ToEmail = booking.Customer.Email,
                        Subject = "⚠️ Thông báo hủy lịch hẹn - HomeService Platform",
                        HtmlBody = GenerateBookingCancellationEmailTemplate(
                            booking.Customer.FullName ?? booking.Customer.UserName,
                            booking.DesiredDate?.ToString("dd/MM/yyyy HH:mm") ?? "N/A",
                            input.Reason
                        )
                    };

                    await _emailService.SendEmailAsync(emailDto);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to send cancellation email: {ex.Message}");
                }
            }

            return true;
        }

        private string GenerateBookingCancellationEmailTemplate(string customerName, string bookingDate, string reason)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .icon {{ font-size: 48px; margin-bottom: 20px; }}
                    .info-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff4d4f; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <div class='icon'>❌</div>
                        <h1>Thông báo hủy lịch hẹn</h1>
                    </div>
                    <div class='content'>
                        <p>Xin chào <strong>{customerName}</strong>,</p>
                        
                        <p>Chúng tôi rất tiếc phải thông báo rằng lịch hẹn dịch vụ của bạn đã bị hủy bởi kỹ thuật viên.</p>
                        
                        <div class='info-box'>
                            <h3 style='color: #ff4d4f; margin: 0 0 15px 0;'>Chi tiết hủy đơn:</h3>
                            <ul style='margin: 0; padding-left: 20px;'>
                                <li><strong>Thời gian hẹn:</strong> {bookingDate}</li>
                                <li><strong>Lý do hủy:</strong> {reason}</li>
                            </ul>
                        </div>
                        
                        <p>Nếu bạn cần hỗ trợ đặt lại lịch mới hoặc có thắc mắc, vui lòng liên hệ với bộ phận CSKH.</p>
                        
                        <p>Chúng tôi thành thật xin lỗi vì sự bất tiện này.</p>
                        
                        <p>Trân trọng,<br>
                        <strong>Đội ngũ HomeService Platform</strong></p>
                    </div>
                    <div class='footer'>
                        <p>© 2024 HomeService Platform. Tất cả quyền được bảo lưu.</p>
                        <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                    </div>
                </div>
            </body>
            </html>";
        }

        public async Task<BookingAcceptResultDto> AcceptBookingEmailAsync(Guid customerId, Guid technicianId, List<Guid> ServiceIds,
            string token, DateTime desiredDate)
        {
            var waiting = await _redisCacheService.GetAsync<string>($"waiting_{token}");
            if (string.IsNullOrEmpty(waiting))
                return new BookingAcceptResultDto { IsSuccess = false, Message = "Link đã hết hạn hoặc đã được sử dụng." };
            var technician = await _technicianRepository.GetAll()
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == technicianId);
            if (technician?.User == null)
                return new BookingAcceptResultDto { IsSuccess = false, Message = "Không tìm thấy kỹ thuật viên." };
            var storedTechId = await _redisCacheService.GetAsync<Guid>($"accept_{token}");
            if (storedTechId == Guid.Empty || storedTechId != technicianId)
                return new BookingAcceptResultDto { IsSuccess = false, Message = "Token không hợp lệ hoặc kỹ thuật viên không khớp." };
            using (var transaction = await _unitOfWork.BeginTransactionAsync())
            {
                try
                {
                    await _redisCacheService.RemoveAsync($"waiting_{token}");
                    await _redisCacheService.SetAsync($"accepted_{token}", technician.Id, TimeSpan.FromSeconds(60));

                    var customer = await _userRepository.FindByIdAsync(customerId);
                    if (customer == null)
                        return new BookingAcceptResultDto { IsSuccess = false, Message = "Dữ liệu khách hàng không hợp lệ." };
                    var services = await _serviceRepository.GetAll()
                        .Where(x => ServiceIds.Contains(x.Id))
                        .ToListAsync();
                    if (services == null || !services.Any())
                        return new BookingAcceptResultDto { IsSuccess = false, Message = "Không tìm thấy dịch vụ hợp lệ." };
                    var newBooking = new Booking
                    {
                        CustomerId = customer.Id,
                        TechnicianId = technician.Id,
                        DesiredDate = desiredDate,
                        DateCreated = DateTime.UtcNow,
                        Status = BookingStatus.Pending
                    };
                    var bookingItems = services.Select(s => new BookingItem
                    {
                        Booking = newBooking,
                        ServiceId = s.Id,
                        Price = s.Price,
                    }).ToList();
                    await _bookingRepository.AddAsync(newBooking);
                    await _bookingItemRepository.AddRangeAsync(bookingItems);
                    await _unitOfWork.SaveChangesAsync();
                    var conversation = new ChatConversation
                    {
                        BookingId = newBooking.Id,
                        CustomerId = customer.Id,
                        TechnicianId = technician.Id,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _conversationRepository.AddAsync(conversation);
                    await _unitOfWork.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return new BookingAcceptResultDto { IsSuccess = true, Message = "Xác nhận thành công!" };
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
        }
    }
}