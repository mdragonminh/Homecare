using HSP.Core.Constans;
using HSP.Core.Dtos.BookingDto;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using HSP.DAL.Extensions;

namespace HSP.Service.Implementations
{
	public class BookingService : BaseService, IBookingService
	{
		private readonly IRepository<Booking, Guid> _bookingRepository;
		private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;
		//private readonly IRepository<CustomerProfile, Guid> _customerProfileRepository;
		private readonly IRepository<Core.Entities.Service, Guid> _serviceRepository;
		private readonly IUserRepository _userRepository;

		public BookingService(
				IRepository<Booking, Guid> bookingRepository,
				IRepository<TechnicianProfile, Guid> technicianRepository,
				//IRepository<CustomerProfile, Guid> customerProfileRepository,
				IRepository<Core.Entities.Service, Guid> serviceRepository,
				IUserRepository userRepository,
				IUnitOfWork unitOfWork,
				IStringLocalizer<SharedResource> localizer) : base(unitOfWork, localizer)
		{
			_bookingRepository = bookingRepository;
			_technicianRepository = technicianRepository;
			//_customerProfileRepository = customerProfileRepository;
			_serviceRepository = serviceRepository;
			_userRepository = userRepository;
		}

		public async Task<PagedList<BookingDto>> GetAllBookingsAsync(BookingInput input)
		{
			var query = _bookingRepository.GetAll(
					b => b.Customer,
					b => b.Service
			);

			// Apply filters
			if (!string.IsNullOrEmpty(input.SearchTerm))
			{
				query = query.Where(b =>
						(b.Customer != null && b.Customer.UserName != null &&
						 b.Customer.UserName.Contains(input.SearchTerm)) ||
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
			query = query.OrderByDescending(b => b.DateCreated);

			var totalCount = await query.CountAsync();
			var items = await query
					.Skip((input.PageNumber - 1) * input.PageSize)
					.Take(input.PageSize)
					.Select(b => new BookingDto
					{
						Id = b.Id,
						CustomerProfileId = b.CustomerId,
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
							UserId = b.CustomerId,
							Email = b.Customer.Email ?? "",
							PhoneNumber = b.Customer.PhoneNumber ?? ""
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
							//BasePrice = b.Service.BasePrice
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
				CustomerProfileId = booking.CustomerId,
				TechnicianId = booking.TechnicianId,
				ServiceId = booking.ServiceId,
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
				ServiceName = booking.Service.Name,
				//ServiceBasePrice = booking.Service.BasePrice,
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

		public async Task<bool> AcceptBookingAsync(Guid customerId, Guid technicianId, Guid serviceId, string token, DateTime desiredDate)
		{
			var technician = await _technicianRepository.GetAll()
				.Include(t => t.User)
				.FirstOrDefaultAsync(t => t.Id == technicianId);

			if (technician?.User == null)
				throw new Exception("Technician not found or invalid.");

			var isValid = await _userRepository.VerifyUserTokenAsync(technician.User,
				IdentityTokenPurposes.Booking,
				IdentityTokenPurposes.AcceptBooking,
				token);

			if (!isValid)
				throw new Exception("Token invalid or expired.");
			ServiceRequestService.AcceptBookingResponse(token, technicianId);
			var customer = await _userRepository.FindByIdAsync(customerId);
			//var customer = await _customerProfileRepository.GetByIdAsync(customerId);
			var service = await _serviceRepository.GetByIdAsync(serviceId);

			if (customer == null || service == null)
				throw new Exception("Invalid data: Customer, Technician or Service not found.");

			var newBooking = new Booking
			{
				CustomerId = customer.Id,
				TechnicianId = technician.Id,
				ServiceId = service.Id,
				DesiredDate = desiredDate,
				DateCreated = DateTime.UtcNow,
				Status = BookingStatus.Confirmed
			};

			await _bookingRepository.AddAsync(newBooking);
			await _unitOfWork.SaveChangesAsync();

			return true;
		}

	}
}
