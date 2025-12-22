using HSP.Core.Abstractions.DataAccess;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HSP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatisticsController : ControllerBase
    {
        private readonly IRepository<Booking, Guid> _bookingRepository;
        private readonly IRepository<TechnicianProfile, Guid> _technicianRepository;
        private readonly IRepository<BookingFeedback, Guid> _feedbackRepository;

        public StatisticsController(
            IRepository<Booking, Guid> bookingRepository,
            IRepository<TechnicianProfile, Guid> technicianRepository,
            IRepository<BookingFeedback, Guid> feedbackRepository)
        {
            _bookingRepository = bookingRepository;
            _technicianRepository = technicianRepository;
            _feedbackRepository = feedbackRepository;
        }

        /// <summary>
        /// Get public statistics for homepage - No authentication required
        /// </summary>
        [HttpGet("public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicStatistics()
        {
            try
            {
                // Get all bookings (not deleted)
                var bookings = await _bookingRepository.GetAll()
                    .Where(b => !b.IsDeleted)
                    .ToListAsync();

                // Calculate total bookings
                var totalBookings = bookings.Count;

                // Calculate completed bookings
                var completedBookings = bookings.Count(b => b.Status == BookingStatus.Completed);
                
                // Calculate completion rate
                var completionRate = totalBookings > 0 
                    ? Math.Round((double)completedBookings / totalBookings * 100, 2) 
                    : 0;

                // Get all technicians (not deleted)
                var technicians = await _technicianRepository.GetAll()
                    .Where(t => !t.IsDeleted)
                    .ToListAsync();
                
                // Calculate active technicians (approved)
                var totalTechnicians = technicians.Count;
                var activeTechnicians = technicians.Count(t => t.ApprovalStatus == TechnicianApprovalStatus.Approved);

                // Get all customer feedbacks
                var customerFeedbacks = await _feedbackRepository.GetAll()
                    .Where(f => f.Source == FeedbackSource.Customer)
                    .ToListAsync();

                // Calculate customer satisfaction
                var customerSatisfaction = 0.0;
                if (customerFeedbacks.Count > 0)
                {
                    var averageRating = customerFeedbacks.Average(f => f.Rating);
                    customerSatisfaction = Math.Round(averageRating / 5.0 * 100, 2);
                }

                var statistics = new
                {
                    totalBookings = totalBookings,
                    totalTechnicians = totalTechnicians,
                    activeTechnicians = activeTechnicians,
                    completionRate = completionRate,
                    customerSatisfaction = customerSatisfaction
                };

                // Log for debugging
                Console.WriteLine($"Statistics API called - Total Bookings: {totalBookings}, Total Technicians: {totalTechnicians}, Active: {activeTechnicians}, Completion Rate: {completionRate}%, Satisfaction: {customerSatisfaction}%");

                return Ok(statistics);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetPublicStatistics: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "An error occurred while retrieving statistics", details = ex.Message });
            }
        }
    }
}
