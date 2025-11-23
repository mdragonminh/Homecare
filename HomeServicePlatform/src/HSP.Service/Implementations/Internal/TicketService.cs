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

        public TicketService(
            IRepository<Ticket, Guid> ticketRepository,
            IRepository<Booking, Guid> bookingRepository,
            IEmailService emailService,
            IUserRepository userRepository,
            IRepository<Equipment, Guid> equipmentRepository,
            IRepository<TechnicianProfile, Guid> technicianProfileRepository,
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
        }

        public async Task<PagedList<TicketDto>> GetTicketsAsync(Guid userId, string userRole, PaginationParams paginationParams)
        {
            var ticketsQuery = _ticketRepository.GetAll()
                .Where(t => t.IsDeleted == false)
                .Include(t => t.Customer) 
                .Include(t => t.Booking)  
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

            var ticketsDto = pagedTickets.Items.Select(t => new TicketDto
            {
                Id = t.Id,
                BookingId = t.BookingId,
                CustomerId = t.CustomerId,
                SupporterId = t.SupporterId,
                TechnicianId = t.TechnicianId,
                IssueDescription = t.IssueDescription,
                Status = t.Status.ToString(),
                DateCreated = t.DateCreated,
                StartedAt = t.StartedAt,
                CompletedAt = t.CompletedAt,
                CustomerName = t.Customer?.FullName ?? "Unknown",
                TechnicianName = t.Technician?.User?.FullName ?? "Not assigned",
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

            var supporterUser = await _userRepository.FindByIdAsync(supporterGuid);
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

            var booking = await _bookingRepository.GetByIdAsync(createDto.BookingId);
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

            var newTicket = new Ticket
            {
                Id = Guid.NewGuid(),
                BookingId = createDto.BookingId,
                CustomerId = customerGuid,
                IssueDescription = createDto.IssueDescription,
                Status = TicketStatus.NotAccepted, 
                SupporterId = null, 
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                IsDeleted = false
            };

            await _ticketRepository.AddAsync(newTicket);
            await _unitOfWork.SaveChangesAsync();

            return new TicketDto
            {
                Id = newTicket.Id,
                BookingId = newTicket.BookingId,
                CustomerId = newTicket.CustomerId,
                IssueDescription = newTicket.IssueDescription,
                Status = newTicket.Status.ToString(),
                DateCreated = newTicket.DateCreated,
                CustomerName = booking.Customer?.FullName ?? "N/A" 
            };
        }
    }
}

