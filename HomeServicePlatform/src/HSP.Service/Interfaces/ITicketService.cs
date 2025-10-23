using HSP.Core.Dtos.Shared;
using HSP.Service.DTOs.Ticket;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HSP.Service.Interfaces
{
    public interface ITicketService
    {
        Task<PagedList<TicketDto>> GetTicketsBySupporterAsync(string supporterId, PaginationParams paginationParams);

        Task<bool> AssignTechnicianAsync(AssignTechnicianDto assignDto, string supporterId);

        Task<bool> UpdateTicketStatusAsync(UpdateTicketStatusDto updateDto, string supporterId);
    }
}