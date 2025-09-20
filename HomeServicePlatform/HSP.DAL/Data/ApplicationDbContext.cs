using HSP.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HSP.DAL.Data
{
	public class ApplicationDbContext : IdentityDbContext<AppUser, AppRole, Guid>
	{
		public ApplicationDbContext(DbContextOptions options) : base(options)
		{
		}

		protected ApplicationDbContext()
		{
		}

		public DbSet<CustomerProfile> CustomerProfiles { get; set; }
		public DbSet<TechnicianProfile> TechnicianProfiles { get; set; }
		public DbSet<Home> Homes { get; set; }

		protected override void OnModelCreating(ModelBuilder builder)
		{
			base.OnModelCreating(builder);
			builder.Entity<AppUser>().ToTable("AppUsers");
			builder.Entity<AppRole>().ToTable("AppRoles");
			builder.Entity<IdentityUserRole<Guid>>().ToTable("AppUserRoles");
			builder.Entity<IdentityUserClaim<Guid>>().ToTable("AppUserClaims");
			builder.Entity<IdentityUserLogin<Guid>>().ToTable("AppUserLogins");
			builder.Entity<IdentityRoleClaim<Guid>>().ToTable("AppRoleClaims");
			builder.Entity<IdentityUserToken<Guid>>().ToTable("AppUserTokens");

			builder.Entity<AppUser>()
					.HasIndex(u => u.NormalizedUserName).IsUnique();
			builder.Entity<AppUser>()
					.HasIndex(u => u.NormalizedEmail);

			builder.Entity<CustomerProfile>()
			.HasOne(p => p.User)
			.WithOne(u => u.CustomerProfile)
			.HasForeignKey<CustomerProfile>(p => p.UserId)
			.OnDelete(DeleteBehavior.Cascade);
			builder.Entity<TechnicianProfile>()
			.HasOne(p => p.User)
			.WithOne(u => u.TechnicianProfile)
			.HasForeignKey<TechnicianProfile>(p => p.UserId)
			.OnDelete(DeleteBehavior.Cascade);
			builder.Entity<Home>()
			.HasOne(h => h.CustomerProfile)
			.WithMany(cp => cp.Homes)
			.HasForeignKey(h => h.CustomerProfileId)
			.OnDelete(DeleteBehavior.Cascade);
		}
	}
}
