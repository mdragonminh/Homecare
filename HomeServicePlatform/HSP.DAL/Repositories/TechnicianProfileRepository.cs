using HSP.Core.Dtos.Shared;
using HSP.Core.Dtos.TechnicianProfileDto;
using HSP.Core.Entities;
using HSP.Core.Enums;
using HSP.Core.Interfaces.DataAccess;
using HSP.DAL.Data;
using Microsoft.EntityFrameworkCore;

namespace HSP.DAL.Repositories
{
    public class TechnicianProfileRepository : Repository<TechnicianProfile, Guid>, ITechnicianProfileRepository
    {
        private readonly ApplicationDbContext _context;

        public TechnicianProfileRepository(ApplicationDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<PagedList<TechnicianProfileResponseDto>> GetTechniciansAsync(TechnicianProfileFilterParams filterParams)
        {
            var query = _context.TechnicianProfiles
                .Include(tp => tp.User)
                .Where(tp => !tp.IsDeleted)
                .AsQueryable();

            // Apply filters
            if (filterParams.ApprovalStatus.HasValue)
            {
                query = query.Where(tp => tp.ApprovalStatus == filterParams.ApprovalStatus.Value);
            }

            if (!string.IsNullOrEmpty(filterParams.SearchTerm))
            {
                var searchTerm = filterParams.SearchTerm.ToLower();
                query = query.Where(tp => 
                    (tp.User.UserName != null && tp.User.UserName.ToLower().Contains(searchTerm)) ||
                    (tp.User.Email != null && tp.User.Email.ToLower().Contains(searchTerm)) ||
                    tp.User.FullName.ToLower().Contains(searchTerm) ||
                    tp.SkillSet.ToLower().Contains(searchTerm));
            }

            if (filterParams.MinExperienceYears.HasValue)
            {
                query = query.Where(tp => tp.ExperienceYears >= filterParams.MinExperienceYears.Value);
            }

            if (filterParams.MaxExperienceYears.HasValue)
            {
                query = query.Where(tp => tp.ExperienceYears <= filterParams.MaxExperienceYears.Value);
            }

            if (filterParams.CreatedFrom.HasValue)
            {
                query = query.Where(tp => tp.DateCreated >= filterParams.CreatedFrom.Value);
            }

            if (filterParams.CreatedTo.HasValue)
            {
                query = query.Where(tp => tp.DateCreated <= filterParams.CreatedTo.Value);
            }

            // Apply ordering
            query = query.OrderByDescending(tp => tp.DateCreated);

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .Skip((filterParams.PageNumber - 1) * filterParams.PageSize)
                .Take(filterParams.PageSize)
                .Select(tp => new TechnicianProfileResponseDto
                {
                    Id = tp.Id,
                    UserId = tp.UserId,
                    UserName = tp.User.UserName ?? string.Empty,
                    Email = tp.User.Email ?? string.Empty,
                    PhoneNumber = tp.User.PhoneNumber ?? string.Empty,
                    FullName = tp.User.FullName,
                    SkillSet = tp.SkillSet,
                    ExperienceYears = tp.ExperienceYears,
                    ApprovalStatus = tp.ApprovalStatus,
                    ApprovedAt = tp.ApprovedAt,
                    ApprovedBy = tp.ApprovedBy,
                    DateCreated = tp.DateCreated,
                    DateModified = tp.DateModified
                })
                .ToListAsync();

            return new PagedList<TechnicianProfileResponseDto>(items, totalCount, filterParams.PageNumber, filterParams.PageSize);
        }

        public async Task<TechnicianProfileResponseDto?> GetTechnicianByIdAsync(Guid id)
        {
            return await _context.TechnicianProfiles
                .Include(tp => tp.User)
                .Where(tp => tp.Id == id && !tp.IsDeleted)
                .Select(tp => new TechnicianProfileResponseDto
                {
                    Id = tp.Id,
                    UserId = tp.UserId,
                    UserName = tp.User.UserName ?? string.Empty,
                    Email = tp.User.Email ?? string.Empty,
                    PhoneNumber = tp.User.PhoneNumber ?? string.Empty,
                    FullName = tp.User.FullName,
                    SkillSet = tp.SkillSet,
                    ExperienceYears = tp.ExperienceYears,
                    ApprovalStatus = tp.ApprovalStatus,
                    ApprovedAt = tp.ApprovedAt,
                    ApprovedBy = tp.ApprovedBy,
                    DateCreated = tp.DateCreated,
                    DateModified = tp.DateModified
                })
                .FirstOrDefaultAsync();
        }

        public async Task<TechnicianProfile?> GetTechnicianProfileByUserIdAsync(Guid userId)
        {
            return await _context.TechnicianProfiles
                .Include(tp => tp.User)
                .FirstOrDefaultAsync(tp => tp.UserId == userId && !tp.IsDeleted);
        }

        public async Task<bool> ApproveTechnicianAsync(Guid technicianProfileId, string approvedBy)
        {
            var technicianProfile = await GetByIdAsync(technicianProfileId);
            if (technicianProfile == null || technicianProfile.IsDeleted)
                return false;

            technicianProfile.ApprovalStatus = TechnicianApprovalStatus.Approved;
            technicianProfile.ApprovedAt = DateTime.UtcNow;
            technicianProfile.ApprovedBy = approvedBy;
            technicianProfile.DateModified = DateTime.UtcNow;

            return true;
        }

        public async Task<bool> RejectTechnicianAsync(Guid technicianProfileId, string rejectedBy)
        {
            var technicianProfile = await GetByIdAsync(technicianProfileId);
            if (technicianProfile == null || technicianProfile.IsDeleted)
                return false;

            technicianProfile.ApprovalStatus = TechnicianApprovalStatus.Rejected;
            technicianProfile.ApprovedAt = DateTime.UtcNow;
            technicianProfile.ApprovedBy = rejectedBy;
            technicianProfile.DateModified = DateTime.UtcNow;

            return true;
        }
    }
}
