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
using Microsoft.VisualBasic;
using System;
using System.Linq.Dynamic.Core.Tokenizer;

namespace HSP.Service.Implementations.Internal
{
    public class BookingService : BaseService, IBookingService
    {
        private readonly IRepository<Booking, Guid> _bookingRepository;
        private readonly IRepository<BookingItem, Guid> _bookingItemRepository;
        private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;
        private readonly IRepository<Core.Entities.Service, Guid> _serviceRepository;
        private readonly IRepository<Equipment, Guid> _equipmentRepository;
        private readonly IRepository<BookingEquipment, Guid> _bookingEquipmentRepository;
        private readonly IRepository<ChatConversation, Guid> _conversationRepository;
        private readonly IGeocodingService _geocodingService;
        private readonly IUserRepository _userRepository;
        private readonly IRedisCacheService _redisCacheService;
        private readonly IEmailService _emailService;
        public BookingService(
                IRepository<Booking, Guid> bookingRepository,
                IRepository<BookingItem, Guid> bookingItemRepository,
                IRepository<TechnicianProfile, Guid> technicianRepository,
                IRepository<Core.Entities.Service, Guid> serviceRepository,
                IGeocodingService geocodingService,
                IUserRepository userRepository,
                IRedisCacheService redisCacheService,
                IRepository<ChatConversation, Guid> conversationRepository,
                IUnitOfWork unitOfWork,
                IStringLocalizer<SharedResource> localizer,
                IEmailService emailService, 
                IRepository<Equipment, Guid> equipmentRepository,
                IRepository<BookingEquipment, Guid> bookingEquipmentRepository) : base(unitOfWork, localizer)
        {
            _bookingRepository = bookingRepository;
            _bookingItemRepository = bookingItemRepository;
            _technicianRepository = technicianRepository;
            _serviceRepository = serviceRepository;
            _userRepository = userRepository;
            _redisCacheService = redisCacheService;
            _geocodingService = geocodingService;
            _conversationRepository = conversationRepository;
            _emailService = emailService;
            _equipmentRepository = equipmentRepository;
            _bookingEquipmentRepository = bookingEquipmentRepository;
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
                Service = _bookingItemRepository.GetAll()
                            .Where(item => item.BookingId == b.Id && !item.IsDeleted)
                            .Select(item => new Core.Dtos.ServiceDto.HomeServiceDto
                            {
                                Id = item.Service.Id,
                                Name = item.Service.Name,
                            })
                            .FirstOrDefault(),
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
            var booking = await _bookingRepository.GetAll()
               .Include(b => b.Customer)
               .Include(b => b.Technician).ThenInclude(t => t.User)
               .Include(b => b.Items).ThenInclude(i => i.Service)
               .Include(b => b.Equipments).ThenInclude(e => e.Equipment)
               .Include(b => b.Payments)
               .Include(b => b.Feedbacks)
               .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
                throw new KeyNotFoundException("Không tìm thấy booking");

            // Lấy tất cả feedbacks từ technician về customer từ tất cả các booking đã hoàn thành
            // Để technician có thể thấy rating của customer khi quyết định nhận booking
            var customerFeedbacks = booking.CustomerId != null
                ? await _bookingRepository.GetAll()
                    .Include(b => b.Feedbacks)
                    .Where(b => b.CustomerId == booking.CustomerId 
                        && b.Status == BookingStatus.Completed
                        && b.Feedbacks.Any(f => f.Source == FeedbackSource.Technician))
                    .SelectMany(b => b.Feedbacks)
                    .Where(f => f.Source == FeedbackSource.Technician)
                    .ToListAsync()
                : new List<BookingFeedback>();
            
            var address = await _geocodingService.GetAddressForCoordinatesAsync(booking.Latitude, booking.Longitude);
            var bookingItems = await _bookingItemRepository.GetAll(i => i.Service)
               .Where(i => i.BookingId == bookingId && !i.IsDeleted)
               .ToListAsync();
            var servicePrice = booking.Items.Where(i => !i.IsDeleted).Sum(i => i.Price);

            var equipmentPrice = booking.Equipments
                .Where(e => !e.IsDeleted) 
                .Sum(e => e.Quantity * e.UnitPrice);

            var totalPrice = servicePrice + equipmentPrice;

            var dto = new BookingDetailDto
            {
                Id = booking.Id,
                Status = booking.Status,
                DesiredDate = booking.DesiredDate,
                DateCreated = booking.DateCreated,
                DateModified = booking.DateModified,
                DateCompleted = booking.DateCompleted,
                ProblemDescription = booking.ProblemDescription,

                Address = address ?? string.Empty,

                CustomerName = booking.Customer?.FullName,
                CustomerEmail = booking.Customer?.Email,
                CustomerPhone = booking.Customer?.PhoneNumber,

                CustomerAverageRating = customerFeedbacks.Any()
                    ? customerFeedbacks.Average(f => f.Rating)
                    : 0,

                CustomerRatingCount = customerFeedbacks.Count,

                TechnicianId = booking.TechnicianId,
                TechnicianName = booking.Technician?.User?.FullName,
                TechnicianEmail = booking.Technician?.User?.Email,
                TechnicianPhone = booking.Technician?.User?.PhoneNumber,

                Items = booking.Items.Select(i => new BookingItemDto
                {
                    ServiceId = i.ServiceId,
                    ServiceName = i.Service?.Name,
                    Price = i.Price
                }).ToList(),

                Equipments = booking.Equipments
                    .Where(e => !e.IsDeleted) 
                    .Select(e => new BookingEquipmentDto
                    {
                        Id = e.Id,
                        EquipmentId = e.EquipmentId,
                        EquipmentName = e.Equipment.Name, 
                        Quantity = e.Quantity,
                        UnitPrice = e.UnitPrice,
                        TotalPrice = e.Quantity * e.UnitPrice
                    }).ToList(),

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
                }).ToList(),
                Feedbacks = booking.Feedbacks.Select(f => new BookingFeedbackResponseDto
                {
                    BookingId = f.BookingId,
                    Rating = f.Rating,
                    Comment = f.Comment,
                    Source = f.Source
                }).ToList(),
                TotalPrice = totalPrice
            };

            return dto;
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

                    // Convert UTC to Vietnam timezone for display in email
                    string bookingDateStr = "N/A";
                    if (booking.DesiredDate.HasValue)
                    {
                        DateTime vietnamTime = ConvertUtcToVietnamTime(booking.DesiredDate.Value);
                        bookingDateStr = vietnamTime.ToString("dd/MM/yyyy HH:mm");
                    }

                    var emailDto = new EmailDto
                    {
                        ToEmail = booking.Customer.Email,
                        Subject = "⚠️ Thông báo hủy lịch hẹn - HomeService Platform",
                        HtmlBody = GenerateBookingCancellationEmailTemplate(
                            booking.Customer.FullName ?? booking.Customer.UserName,
                            bookingDateStr,
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

        private DateTime ConvertUtcToVietnamTime(DateTime utcDateTime)
        {
            if (utcDateTime.Kind != DateTimeKind.Utc)
            {
                utcDateTime = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
            }

            TimeZoneInfo vietnamZone;
            try
            {
                // Try Windows timezone ID first
                vietnamZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                try
                {
                    // Try Linux/Mac timezone ID
                    vietnamZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
                }
                catch (TimeZoneNotFoundException)
                {
                    // Fallback: manually add 7 hours (Vietnam is UTC+7)
                    return utcDateTime.AddHours(7);
                }
            }

            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, vietnamZone);
        }

        public async Task<BookingAcceptResultDto> AcceptBookingAsync(Guid userId, AcceptBookingDto input)
        {
            var waiting = await _redisCacheService.GetAsync<string>($"waiting_{input.Token}");
            Console.WriteLine($"Redis waiting_{input.Token}: {waiting}");
            if (string.IsNullOrEmpty(waiting))
                return new BookingAcceptResultDto { IsSuccess = false, Message = "Link đã hết hạn hoặc đã sử dụng." };

            var allowedTech = await _redisCacheService.GetAsync<Guid>($"accept_{input.Token}");
            var technician = await _technicianRepository.GetAll()
                     .FirstOrDefaultAsync(t => t.UserId == userId);
            if (allowedTech == Guid.Empty || allowedTech != technician.Id)
                return new BookingAcceptResultDto { IsSuccess = false, Message = "Bạn không phải kỹ thuật viên được mời." };

            var booking = await _bookingRepository.GetByIdAsync(input.BookingId);
            if (booking == null)
                return new BookingAcceptResultDto { IsSuccess = false, Message = "Booking không tồn tại." };

            if (booking.Status != BookingStatus.Pending)
                return new BookingAcceptResultDto { IsSuccess = false, Message = "Booking đã được xử lý." };
            using (var transaction = await _unitOfWork.BeginTransactionAsync())
            {
                booking.TechnicianId = technician.Id;
                booking.Status = BookingStatus.Confirmed;
                booking.DateModified = DateTime.UtcNow;
                await _unitOfWork.SaveChangesAsync();
                var conversation = new ChatConversation
                {
                    BookingId = booking.Id,
                    CustomerId = booking.CustomerId,
                    TechnicianId = technician.Id,
                    CreatedAt = DateTime.UtcNow
                };
                await _conversationRepository.AddAsync(conversation);
                await _unitOfWork.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            await _redisCacheService.SetAsync($"accepted_{input.Token}", technician.Id, TimeSpan.FromSeconds(60));

            await _redisCacheService.RemoveAsync($"waiting_{input.Token}");
            await _redisCacheService.RemoveAsync($"accept_{input.Token}");

            return new BookingAcceptResultDto
            {
                IsSuccess = true,
                Message = "Bạn đã nhận booking thành công."
            };
        }

        public async Task<bool> TechnicianRejectAsync(Guid bookingId, Guid technicianUserId)
        {
            var technician = await _technicianRepository.GetAll()
                 .FirstOrDefaultAsync(t => t.UserId == technicianUserId);

            if (technician == null)
                throw new Exception("Kỹ thuật viên không tồn tại");

            await _redisCacheService.SetAsync(
                $"reject_{bookingId}_{technician.Id}",
                "rejected");
            return true;
        }

        public async Task<bool> AddEquipmentToBookingAsync(Guid bookingId, AddBookingEquipmentDto input, Guid userId)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId);
            if (booking == null)
                throw new KeyNotFoundException("Booking không tồn tại");

            var technicianProfile = await _technicianRepository.GetAll(t => t.User)
                    .FirstOrDefaultAsync(t => t.User.Id.ToString() == userId.ToString());

            if (technicianProfile == null || booking.TechnicianId != technicianProfile.Id)
                throw new UnauthorizedAccessException("Bạn không phải kỹ thuật viên của booking này");

            if (booking.Status != BookingStatus.InProgress && booking.Status != BookingStatus.Confirmed)
                throw new InvalidOperationException("Chỉ có thể thêm thiết bị khi đang thực hiện công việc");

            using (var transaction = await _unitOfWork.BeginTransactionAsync())
            {
                try
                {
                    var equipment = await _equipmentRepository.GetByIdAsync(input.EquipmentId);
                    if (equipment == null)
                        throw new KeyNotFoundException("Thiết bị không tồn tại");

                    if (equipment.Quantity < input.Quantity)
                        throw new InvalidOperationException($"Kho không đủ hàng. Chỉ còn {equipment.Quantity} {equipment.UnitOfMeasure}");

                    var existingItem = await _bookingEquipmentRepository.GetAll()
                        .FirstOrDefaultAsync(be => be.BookingId == bookingId &&
                                                 be.EquipmentId == input.EquipmentId &&
                                                 !be.IsDeleted);

                    if (existingItem != null)
                    {
                        existingItem.Quantity += input.Quantity;

                        existingItem.UnitPrice = equipment.UnitPrice;

                        _bookingEquipmentRepository.Update(existingItem);
                    }
                    else
                    {
                        var bookingEquipment = new BookingEquipment
                        {
                            BookingId = bookingId,
                            EquipmentId = input.EquipmentId,
                            Quantity = input.Quantity,
                            UnitPrice = equipment.UnitPrice,
                            IsDeleted = false
                        };
                        await _bookingEquipmentRepository.AddAsync(bookingEquipment);
                    }

                    equipment.Quantity -= input.Quantity;
                    _equipmentRepository.Update(equipment);

                    booking.DateModified = DateTime.UtcNow;
                    _bookingRepository.Update(booking);

                    await _unitOfWork.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return true;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
        }

        public async Task<bool> RemoveEquipmentFromBookingAsync(Guid bookingId, Guid bookingEquipmentId, Guid userId)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId);
            if (booking == null) throw new KeyNotFoundException("Booking không tồn tại");

            var technicianProfile = await _technicianRepository.GetAll(t => t.User)
                    .FirstOrDefaultAsync(t => t.User.Id.ToString() == userId.ToString());

            if (technicianProfile == null || booking.TechnicianId != technicianProfile.Id)
                throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa booking này");

            if (booking.Status != BookingStatus.InProgress && booking.Status != BookingStatus.Confirmed)
                throw new InvalidOperationException("Không thể xóa thiết bị ở trạng thái này");

            using (var transaction = await _unitOfWork.BeginTransactionAsync())
            {
                try
                {
                    var bookingEquipment = await _bookingEquipmentRepository.GetByIdAsync(bookingEquipmentId);
                    if (bookingEquipment == null) throw new KeyNotFoundException("Không tìm thấy thiết bị trong đơn này");

                    var equipment = await _equipmentRepository.GetByIdAsync(bookingEquipment.EquipmentId);
                    if (equipment != null)
                    {
                        equipment.Quantity += bookingEquipment.Quantity;
                        _equipmentRepository.Update(equipment);
                    }

                    bookingEquipment.IsDeleted = true;
                    _bookingEquipmentRepository.Update(bookingEquipment);

                    booking.DateModified = DateTime.UtcNow;
                    _bookingRepository.Update(booking);

                    await _unitOfWork.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return true;
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