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
        private readonly IEmailService _emailService;
        private readonly IUserRepository _userRepository;
        private readonly IRepository<Equipment, Guid> _equipmentRepository;
        private readonly IRepository<TechnicianProfile, Guid> _technicianProfileRepository;

        public TicketService(
            IRepository<Ticket, Guid> ticketRepository,
            IEmailService emailService,
            IUserRepository userRepository,
            IRepository<Equipment, Guid> equipmentRepository,
            IRepository<TechnicianProfile, Guid> technicianProfileRepository,
            IUnitOfWork unitOfWork, 
            IStringLocalizer<SharedResource> localizer 
            ) : base(unitOfWork, localizer) 
        {
            _ticketRepository = ticketRepository;
            _emailService = emailService;
            _userRepository = userRepository;
            _equipmentRepository = equipmentRepository;
            _technicianProfileRepository = technicianProfileRepository;
        }

        public async Task<PagedList<TicketDto>> GetTicketsBySupporterAsync(string supporterId, PaginationParams paginationParams)
        {
            if (!Guid.TryParse(supporterId, out Guid supporterGuid))
            {
                return new PagedList<TicketDto>(new List<TicketDto>(), 0, paginationParams.PageNumber, paginationParams.PageSize);
            }

            var ticketsQuery = _ticketRepository.GetAll()
                .Where(t => t.SupporterId == supporterGuid && t.IsDeleted == false)
                .Include(t => t.Equipment)
                .Include(t => t.Technician)
                    .ThenInclude(tech => tech.User);

            if (string.IsNullOrWhiteSpace(paginationParams.OrderBy))
            {
                paginationParams.OrderBy = "DateCreated descending";
            }

            var pagedTickets = await ticketsQuery.ToPagedListAsync(paginationParams);

            var ticketsDto = pagedTickets.Items.Select(t => new TicketDto
            {
                Id = t.Id,
                EquipmentId = t.EquipmentId,
                SupporterId = t.SupporterId,
                TechnicianId = t.TechnicianId,
                IssueDescription = t.IssueDescription,
                Status = t.Status.ToString(),
                DateCreated = t.DateCreated,
                StartedAt = t.StartedAt,
                CompletedAt = t.CompletedAt,
                TechnicianName = t.Technician?.User?.FullName ?? "Chưa gán",
                EquipmentName = t.Equipment?.EquipmentCode ?? (t.Equipment?.Name ?? "Không rõ")
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

            if (ticket == null || ticket.SupporterId != supporterGuid)
            {
                return false;
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

            if (ticket == null || ticket.SupporterId != supporterGuid)
            {
                return false;
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

        public async Task<TicketDto> CreateTicketAsync(CreateTicketDto createDto, string supporterId)
        {
            if (!Guid.TryParse(supporterId, out Guid supporterGuid))
            {
                throw new ArgumentException("Invalid supporterId", nameof(supporterId));
            }

            var equipment = await _equipmentRepository.GetByIdAsync(createDto.EquipmentId);
            if (equipment == null)
            {
                throw new InvalidOperationException("Equipment not found");
            }

            var newTicket = new Ticket
            {
                Id = Guid.NewGuid(),
                EquipmentId = createDto.EquipmentId,
                SupporterId = supporterGuid,
                IssueDescription = createDto.IssueDescription,
                Status = TicketStatus.NotAccepted, 
                DateCreated = DateTime.UtcNow,
                DateModified = DateTime.UtcNow,
                IsDeleted = false
            };

            await _ticketRepository.AddAsync(newTicket);
            await _unitOfWork.SaveChangesAsync();

            var supporterUser = await _userRepository.FindByIdAsync(supporterGuid);

            var ticketDto = new TicketDto
            {
                Id = newTicket.Id,
                EquipmentId = newTicket.EquipmentId,
                SupporterId = newTicket.SupporterId,
                IssueDescription = newTicket.IssueDescription,
                Status = newTicket.Status.ToString(),
                DateCreated = newTicket.DateCreated,
                EquipmentName = equipment.EquipmentCode ?? equipment.Name
            };

            if (supporterUser != null && !string.IsNullOrEmpty(supporterUser.Email))
            {
                var emailDto = new Dtos.EmailDto.EmailDto
                {
                    ToEmail = supporterUser.Email,
                    Subject = $"Tạo thành công Ticket #{ticketDto.Id}",
                    HtmlBody = $"<p>Bạn đã tạo thành công ticket #{ticketDto.Id} cho thiết bị '{ticketDto.EquipmentName}'.</p>"
                };
                _ = _emailService.SendEmailAsync(emailDto);
            }

            return ticketDto;
        }
    }
}

