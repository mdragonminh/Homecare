using HSP.Core.Constans;
using HSP.Core.Dtos.Shared;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Core.Resources;
using HSP.DAL.Extensions;
using HSP.Service.DTOs.Ticket;
using HSP.Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace HSP.Service.Implementations.Internal
{
    public class TicketService : BaseService, ITicketService
    {
        private readonly IRepository<Ticket, Guid> _ticketRepository;
        private readonly IRepository<Booking, Guid> _bookingRepository;
        private readonly IEmailService _emailService;
        private readonly IUserRepository _userRepository;
        private readonly IRepository<Equipment, Guid> _equipmentRepository;
        private readonly IRepository<TechnicianProfile, Guid> _technicianProfileRepository;
        private readonly IRepository<BookingFeedback, Guid> _feedbackRepository;

        public TicketService(
            IRepository<Ticket, Guid> ticketRepository,
            IRepository<Booking, Guid> bookingRepository,
            IEmailService emailService,
            IUserRepository userRepository,
            IRepository<Equipment, Guid> equipmentRepository,
            IRepository<TechnicianProfile, Guid> technicianProfileRepository,
            IRepository<BookingFeedback, Guid> feedbackRepository,
            IUnitOfWork unitOfWork,
            IStringLocalizer<SharedResource> localizer
            ) : base(unitOfWork, localizer)
        {
            _ticketRepository = ticketRepository;
            _bookingRepository = bookingRepository;
            _emailService = emailService;
            _userRepository = userRepository;
            _equipmentRepository = equipmentRepository;
            _technicianProfileRepository = technicianProfileRepository;
            _feedbackRepository = feedbackRepository;
        }

        public async Task<PagedList<TicketDto>> GetTicketsAsync(Guid userId, string userRole, PaginationParams paginationParams)
        {
            var ticketsQuery = _ticketRepository.GetAll()
                .Where(t => t.IsDeleted == false)
                .Include(t => t.Customer)
                .Include(t => t.Booking)
                    .ThenInclude(b => b.Customer)
                .Include(t => t.Booking)
                    .ThenInclude(b => b.Technician)
                        .ThenInclude(tp => tp.User)
                .Include(t => t.Booking)
                    .ThenInclude(b => b.Items)
                        .ThenInclude(bi => bi.Service)
                .Include(t => t.Booking)
                    .ThenInclude(b => b.Equipments)
                        .ThenInclude(be => be.Equipment)
                .Include(t => t.Booking)
                    .ThenInclude(b => b.Payments)
                .Include(t => t.Technician)
                    .ThenInclude(tech => tech.User)
                .AsQueryable();

            if (userRole == RoleNames.Customer)
            {
                ticketsQuery = ticketsQuery.Where(t => t.CustomerId == userId);
            }
            else if (userRole == RoleNames.Supporter)
            {
                ticketsQuery = ticketsQuery.Where(t => t.SupporterId == userId || t.SupporterId == null);
            }

            if (string.IsNullOrWhiteSpace(paginationParams.OrderBy))
            {
                ticketsQuery = ticketsQuery.OrderByDescending(t => t.DateCreated);
            }

            var pagedTickets = await ticketsQuery.ToPagedListAsync(paginationParams);

            // Get all customer and technician IDs for rating calculation
            var customerIds = pagedTickets.Items
                .Where(t => t.Booking?.CustomerId != null)
                .Select(t => t.Booking.CustomerId)
                .Distinct()
                .ToList();

            var technicianIds = pagedTickets.Items
                .Where(t => t.Booking?.TechnicianId != null)
                .Select(t => t.Booking.TechnicianId!.Value)
                .Distinct()
                .ToList();

            // Calculate ratings for customers (from their bookings)
            var customerRatings = await _bookingRepository.GetAll()
                .Where(b => customerIds.Contains(b.CustomerId))
                .Include(b => b.Feedbacks)
                .GroupBy(b => b.CustomerId)
                .Select(g => new
                {
                    CustomerId = g.Key,
                    AverageRating = g.SelectMany(b => b.Feedbacks).Any() 
                        ? g.SelectMany(b => b.Feedbacks).Average(f => (double)f.Rating) 
                        : 0,
                    TotalReviews = g.SelectMany(b => b.Feedbacks).Count()
                })
                .ToDictionaryAsync(x => x.CustomerId);

            // Calculate ratings for technicians (from their bookings)
            var technicianRatings = await _bookingRepository.GetAll()
                .Where(b => b.TechnicianId != null && technicianIds.Contains(b.TechnicianId.Value))
                .Include(b => b.Feedbacks)
                .GroupBy(b => b.TechnicianId!.Value)
                .Select(g => new
                {
                    TechnicianId = g.Key,
                    AverageRating = g.SelectMany(b => b.Feedbacks).Any() 
                        ? g.SelectMany(b => b.Feedbacks).Average(f => (double)f.Rating) 
                        : 0,
                    TotalReviews = g.SelectMany(b => b.Feedbacks).Count()
                })
                .ToDictionaryAsync(x => x.TechnicianId);

            var ticketsDto = pagedTickets.Items.Select(t => new TicketDto
            {
                Id = t.Id,
                BookingId = t.BookingId,
                CustomerId = t.CustomerId,
                SupporterId = t.SupporterId,
                TechnicianId = t.TechnicianId,
                IssueDescription = t.IssueDescription,
                IsRefundRequested = t.IsRefundRequested,
                Status = t.Status.ToString(),
                DateCreated = t.DateCreated,
                StartedAt = t.StartedAt,
                CompletedAt = t.CompletedAt,
                CustomerName = t.Customer?.FullName ?? "Unknown",
                TechnicianName = t.Technician?.User?.FullName ?? "Not assigned",
                BookingDetail = t.Booking != null ? new BookingDetailDto
                {
                    Id = t.Booking.Id,
                    DesiredDate = t.Booking.DesiredDate,
                    ProblemDescription = t.Booking.ProblemDescription,
                    Status = t.Booking.Status.ToString(),
                    DateCreated = t.Booking.DateCreated,
                    DateModified = t.Booking.DateModified,
                    Latitude = t.Booking.Latitude,
                    Longitude = t.Booking.Longitude,
                    Customer = t.Booking.Customer != null ? new CustomerInfoDto
                    {
                        FullName = t.Booking.Customer.FullName,
                        PhoneNumber = t.Booking.Customer.PhoneNumber,
                        AverageRating = customerRatings.ContainsKey(t.Booking.CustomerId) 
                            ? customerRatings[t.Booking.CustomerId].AverageRating 
                            : 0,
                        TotalReviews = customerRatings.ContainsKey(t.Booking.CustomerId) 
                            ? customerRatings[t.Booking.CustomerId].TotalReviews 
                            : 0
                    } : null,
                    Technician = t.Booking.Technician?.User != null ? new TechnicianInfoDto
                    {
                        FullName = t.Booking.Technician.User.FullName,
                        PhoneNumber = t.Booking.Technician.User.PhoneNumber,
                        AverageRating = t.Booking.TechnicianId.HasValue && technicianRatings.ContainsKey(t.Booking.TechnicianId.Value) 
                            ? technicianRatings[t.Booking.TechnicianId.Value].AverageRating 
                            : 0,
                        TotalReviews = t.Booking.TechnicianId.HasValue && technicianRatings.ContainsKey(t.Booking.TechnicianId.Value) 
                            ? technicianRatings[t.Booking.TechnicianId.Value].TotalReviews 
                            : 0
                    } : null,
                    Services = t.Booking.Items?.Select(bi => new ServiceItemDto
                    {
                        Name = bi.Service?.Name ?? "Unknown",
                        Price = bi.Price
                    }).ToList() ?? new List<ServiceItemDto>(),
                    Equipments = t.Booking.Equipments?.Select(be => new EquipmentItemDto
                    {
                        Name = be.Equipment?.Name ?? "Unknown",
                        Quantity = be.Quantity,
                        UnitPrice = be.UnitPrice
                    }).ToList() ?? new List<EquipmentItemDto>()
                } : null,
                PaymentDetail = t.Booking?.Payments?.FirstOrDefault() != null ? new PaymentDetailDto
                {
                    Id = t.Booking.Payments.First().Id,
                    Amount = t.Booking.Payments.First().Amount,
                    PaymentMethod = (int)t.Booking.Payments.First().PaymentMethod,
                    Status = (int)t.Booking.Payments.First().Status,
                    TransactionId = t.Booking.Payments.First().TransactionId,
                    PaidAt = t.Booking.Payments.First().PaidAt,
                    DateCreated = t.Booking.Payments.First().DateCreated,
                    Description = t.Booking.Payments.First().Description
                } : null
            }).ToList();

            return new PagedList<TicketDto>(
                ticketsDto,
                pagedTickets.TotalCount,
                pagedTickets.CurrentPage,
                pagedTickets.PageSize
            );
        }

        public async Task<bool> AssignTechnicianAsync(AssignTechnicianDto assignDto, string supporterId)
        {
            if (!Guid.TryParse(supporterId, out Guid supporterGuid) ||
                !Guid.TryParse(assignDto.TechnicianId, out Guid technicianGuid))
            {
                return false;
            }

            var technicianProfile = await _technicianProfileRepository.GetByIdAsync(technicianGuid);
            if (technicianProfile == null)
            {
                return false;
            }

            var ticket = await _ticketRepository.GetByIdAsync(assignDto.TicketId);

            if (ticket == null) return false;

            if (ticket.SupporterId != null && ticket.SupporterId != supporterGuid)
            {
                return false;
            }

            if (ticket.SupporterId == null)
            {
                ticket.SupporterId = supporterGuid;
            }

            ticket.TechnicianId = technicianGuid;
            ticket.DateModified = DateTime.UtcNow;

            _ticketRepository.Update(ticket);
            await _unitOfWork.SaveChangesAsync();

            var techUser = await _userRepository.FindByIdAsync(technicianProfile.UserId);
            if (techUser != null && !string.IsNullOrEmpty(techUser.Email))
            {
                var emailDto = new Dtos.EmailDto.EmailDto
                {
                    ToEmail = techUser.Email,
                    Subject = $"Bạn có ticket mới #{ticket.Id}",
                    HtmlBody = $"<p>Ticket #{ticket.Id} với mô tả '{ticket.IssueDescription}' đã được gán cho bạn.</p>"
                };
                await _emailService.SendEmailAsync(emailDto);
            }

            return true;
        }

        public async Task<bool> UpdateTicketStatusAsync(UpdateTicketStatusDto updateDto, string supporterId)
        {
            if (!Guid.TryParse(supporterId, out Guid supporterGuid))
            {
                return false;
            }

            var ticket = await _ticketRepository.GetByIdAsync(updateDto.TicketId);

            if (ticket == null) return false;

            if (ticket.SupporterId != null && ticket.SupporterId != supporterGuid)
            {
                return false;
            }

            if (ticket.SupporterId == null)
            {
                ticket.SupporterId = supporterGuid;
            }

            var oldStatus = ticket.Status;
            var newStatus = updateDto.NewStatus; 

            if (oldStatus == newStatus) return true;

            ticket.Status = newStatus;
            ticket.DateModified = DateTime.UtcNow;

            if (newStatus == TicketStatus.InProgress && ticket.StartedAt == null)
            {
                ticket.StartedAt = DateTime.UtcNow;
            }
            else if (newStatus == TicketStatus.Complete)
            {
                ticket.CompletedAt = DateTime.UtcNow;
            }

            _ticketRepository.Update(ticket);
            await _unitOfWork.SaveChangesAsync(); 


            var customer = await _userRepository.FindByIdAsync(ticket.CustomerId);
            var supporterUser = await _userRepository.FindByIdAsync(supporterGuid);

            if (customer != null && !string.IsNullOrEmpty(customer.Email))
            {
                var emailDto = new Dtos.EmailDto.EmailDto
                {
                    ToEmail = customer.Email,
                    Subject = $"Cập nhật trạng thái Ticket #{ticket.Id}",
                    HtmlBody = $@"
                            <h3>Xin chào {customer.FullName},</h3>
                            <p>Ticket hỗ trợ <strong>#{ticket.Id}</strong> của bạn vừa có sự thay đổi trạng thái.</p>
                            <p>
                                Trạng thái cũ: <strong>{oldStatus}</strong><br/>
                                Trạng thái mới: <span style='color:blue; font-weight:bold'>{newStatus}</span>
                            </p>
                            <p>Trân trọng,<br/>Đội ngũ hỗ trợ.</p>"
                };
                await _emailService.SendEmailAsync(emailDto);
            }

            if (supporterUser != null && !string.IsNullOrEmpty(supporterUser.Email))
            {
                var emailDto = new Dtos.EmailDto.EmailDto
                {
                    ToEmail = supporterUser.Email,
                    Subject = $"Cập nhật trạng thái Ticket #{ticket.Id}",
                    HtmlBody = $"<p>Trạng thái ticket #{ticket.Id} đã thay đổi từ '{oldStatus}' sang '{newStatus}'.</p>"
                };
                await _emailService.SendEmailAsync(emailDto);
            }

            return true;
        }

        public async Task<TicketDto> CreateTicketAsync(CreateTicketDto createDto, string userId)
        {
            if (!Guid.TryParse(userId, out Guid customerGuid))
            {
                throw new UnauthorizedAccessException("User ID không hợp lệ.");
            }

            var booking = await _bookingRepository.GetAll()
                .Include(b => b.Customer)
                .Include(b => b.Technician)
                .FirstOrDefaultAsync(b => b.Id == createDto.BookingId);
                
            if (booking == null)
            {
                throw new KeyNotFoundException("Không tìm thấy Booking.");
            }

            if (booking.CustomerId != customerGuid)
            {
                throw new UnauthorizedAccessException("Bạn chỉ có thể tạo ticket cho booking của chính mình.");
            }

            var existingTicket = _ticketRepository.GetAll().FirstOrDefault(t => t.BookingId == createDto.BookingId && !t.IsDeleted);
            if (existingTicket != null)
            {
                throw new InvalidOperationException("Booking này đã có ticket đang được xử lý.");
            }

            // Auto-assign technician from booking
            Guid? technicianId = booking.TechnicianId;

            var newTicket = new Ticket
            {
                Id = Guid.NewGuid(),
                BookingId = createDto.BookingId,
                CustomerId = customerGuid,
                TechnicianId = technicianId,
                IssueDescription = createDto.IssueDescription,
                IsRefundRequested = createDto.IsRefundRequested,
                Status = TicketStatus.NotAccepted,
                SupporterId = null,
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                IsDeleted = false
            };

            await _ticketRepository.AddAsync(newTicket);
            await _unitOfWork.SaveChangesAsync();

            // Send notification email to technician if assigned
            if (technicianId.HasValue && booking.Technician != null)
            {
                var techUser = await _userRepository.FindByIdAsync(booking.Technician.UserId);
                if (techUser != null && !string.IsNullOrEmpty(techUser.Email))
                {
                    var emailDto = new Dtos.EmailDto.EmailDto
                    {
                        ToEmail = techUser.Email,
                        Subject = $"Bạn có ticket mới #{newTicket.Id}",
                        HtmlBody = $"<p>Ticket #{newTicket.Id} với mô tả '{newTicket.IssueDescription}' đã được tạo cho booking của bạn.</p>"
                    };
                    await _emailService.SendEmailAsync(emailDto);
                }
            }

            return new TicketDto
            {
                Id = newTicket.Id,
                BookingId = newTicket.BookingId,
                CustomerId = newTicket.CustomerId,
                TechnicianId = newTicket.TechnicianId,
                IssueDescription = newTicket.IssueDescription,
                IsRefundRequested = newTicket.IsRefundRequested,
                Status = newTicket.Status.ToString(),
                DateCreated = newTicket.DateCreated,
                CustomerName = booking.Customer?.FullName ?? "N/A",
                TechnicianName = booking.Technician?.User?.FullName ?? "Not assigned"
            };
        }
    }
}

