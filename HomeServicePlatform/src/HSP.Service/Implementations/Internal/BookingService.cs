using HSP.Core.Dtos.BookingDto;
using HSP.Core.Dtos.PaymentDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
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
        public BookingService(
                IRepository<Booking, Guid> bookingRepository,
                IRepository<BookingItem, Guid> bookingItemRepository,
                IRepository<TechnicianProfile, Guid> technicianRepository,
                IRepository<Core.Entities.Service, Guid> serviceRepository,
                IUserRepository userRepository,
                IRedisCacheService redisCacheService,
                IRepository<ChatConversation, Guid> conversationRepository,
                IUnitOfWork unitOfWork,
                IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
        {
            _bookingRepository = bookingRepository;
            _bookingItemRepository = bookingItemRepository;
            _technicianRepository = technicianRepository;
            _serviceRepository = serviceRepository;
            _userRepository = userRepository;
            _redisCacheService = redisCacheService;
            _conversationRepository = conversationRepository;
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
                Feedback = b.Feedback != null ? new BookingFeedbackResponseDto
                {
                    BookingId = b.Feedback.BookingId,
                    Rating = b.Feedback.Rating,
                    Comment = b.Feedback.Comment
                } : null,
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
                    b => b.Payments
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
                CustomerName = booking.Customer?.UserName,
                CustomerEmail = booking.Customer?.Email,
                CustomerPhone = booking.Customer?.PhoneNumber,
                TechnicianName = technician?.User?.UserName,
                TechnicianEmail = technician?.User?.Email,
                TechnicianPhone = technician?.User?.PhoneNumber,
                Items = bookingItems.Select(i => new BookingItemDto
                {
                    Id = i.Id,
                    ServiceId = i.ServiceId,
                    ServiceName = i.Service?.Name,
                    Price = i.Price
                }).ToList(),
                TotalPrice = totalPrice,
                Feedback = booking.Feedback != null ? new BookingFeedbackResponseDto
                {
                    BookingId = booking.Feedback.BookingId,
                    Rating = booking.Feedback.Rating,
                    Comment = booking.Feedback.Comment
                } : null,
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
            var booking = await _bookingRepository.GetByIdAsync(input.BookingId);
            if (booking == null)
                return false;

            // Verify user is the technician assigned to this booking
            var technicianProfile = await _technicianRepository.GetAll(t => t.User)
                    .FirstOrDefaultAsync(t => t.User.Id.ToString() == userId);

            if (technicianProfile == null || booking.TechnicianId != technicianProfile.Id)
                return false;

            // Check if booking can be cancelled
            if (booking.Status == BookingStatus.Completed || booking.Status == BookingStatus.Cancelled)
                return false;

            // Update booking status
            booking.Status = BookingStatus.Cancelled;
            booking.DateModified = DateTime.UtcNow;

            // Create cancellation record (we'll use Entity Framework navigation property)
            booking.Cancellation = new BookingCancellation
            {
                BookingId = booking.Id,
                Reason = input.Reason,
                CancelledBy = technicianProfile.Id,
                CancelledAt = DateTime.UtcNow
            };

            _bookingRepository.Update(booking);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<BookingAcceptResultDto> AcceptBookingEmailAsync(Guid customerId, Guid technicianId, List<Guid> ServiceIds, string token, DateTime desiredDate)
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
                Status = BookingStatus.Confirmed
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
            return new BookingAcceptResultDto { IsSuccess = true, Message = "Xác nhận thành công!" };
        }
    }
}