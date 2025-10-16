using HSP.Core.Dtos.BookingDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations
{
    public class BookingService : BaseService, IBookingService
    {
        private readonly IRepository<Booking, Guid> _bookingRepository;
        private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;

        public BookingService(
            IRepository<Booking, Guid> bookingRepository,
            IRepository<TechnicianProfile, Guid> technicianRepository,
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
        {
            _bookingRepository = bookingRepository;
            _technicianRepository = technicianRepository;
        }

        public async Task<PagedList<BookingDto>> GetAllBookingsAsync(BookingInput input)
        {
            var query = _bookingRepository.GetAll(
                b => b.Customer,
                b => b.Customer.User,
                b => b.Service
            );

            // Apply filters
            if (!string.IsNullOrEmpty(input.SearchTerm))
            {
                query = query.Where(b =>
                    (b.Customer != null && b.Customer.User != null && b.Customer.User.UserName != null &&
                     b.Customer.User.UserName.Contains(input.SearchTerm)) ||
                    b.Service.Name.Contains(input.SearchTerm) ||
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
                query = query.Where(b => b.CustomerProfileId == input.CustomerId.Value);
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
            query = query.OrderByDescending(b => b.DateCreated);

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((input.PageNumber - 1) * input.PageSize)
                .Take(input.PageSize)
                .Select(b => new BookingDto
                {
                    Id = b.Id,
                    CustomerProfileId = b.CustomerProfileId,
                    TechnicianId = b.TechnicianId,
                    ServiceId = b.ServiceId,
                    DesiredDate = b.DesiredDate.Value,
                    ProblemDescription = b.ProblemDescription,
                    Status = b.Status,
                    DateCompleted = b.DateCompleted,
                    DateCreated = b.DateCreated,
                    DateModified = b.DateModified,
                    Customer = b.Customer != null ? new HSP.Core.Dtos.CustomerProfileDto.CustomerProfileDto
                    {
                        Id = b.Customer.Id,
                        UserId = b.Customer.UserId,
                        Email = b.Customer.User != null ? b.Customer.User.Email : null,
                        PhoneNumber = b.Customer.User != null ? b.Customer.User.PhoneNumber : null
                    } : null,
                    Technician = b.Technician != null ? new HSP.Core.Dtos.TechnicianProfileDto.TechnicianProfileResponseDto
                    {
                        Id = b.Technician.Id,
                        UserId = b.Technician.UserId,
                        Email = b.Technician.User != null ? b.Technician.User.Email : null,
                        PhoneNumber = b.Technician.User != null ? b.Technician.User.PhoneNumber : null
                    } : null,
                    Service = new HSP.Core.Dtos.ServiceDto.HomeServiceDto
                    {
                        Id = b.Service.Id,
                        Name = b.Service.Name,
                        BasePrice = b.Service.BasePrice
                    },
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
                    } : null
                })
                .ToListAsync();

            return new PagedList<BookingDto>(items, totalCount, input.PageNumber, input.PageSize);
        }

        public async Task<BookingDetailDto?> GetBookingDetailAsync(Guid bookingId)
        {
            var booking = await _bookingRepository.GetAll(
                b => b.Customer,
                b => b.Customer.User,
                b => b.Service
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

            return new BookingDetailDto
            {
                Id = booking.Id,
                CustomerProfileId = booking.CustomerProfileId,
                TechnicianId = booking.TechnicianId,
                ServiceId = booking.ServiceId,
                DesiredDate = booking.DesiredDate.Value,
                ProblemDescription = booking.ProblemDescription,
                Status = booking.Status,
                DateCompleted = booking.DateCompleted,
                DateCreated = booking.DateCreated,
                DateModified = booking.DateModified,
                CustomerName = booking.Customer?.User?.UserName,
                CustomerEmail = booking.Customer?.User?.Email,
                CustomerPhone = booking.Customer?.User?.PhoneNumber,
                TechnicianName = technician?.User?.UserName,
                TechnicianEmail = technician?.User?.Email,
                TechnicianPhone = technician?.User?.PhoneNumber,
                ServiceName = booking.Service.Name,
                ServiceBasePrice = booking.Service.BasePrice,
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
                } : null
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
    }
}
