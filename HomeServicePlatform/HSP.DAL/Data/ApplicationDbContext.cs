using HSP.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;
using File = HSP.Core.Entities.File;

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
		public DbSet<HomeItem> HomeItems { get; set; }
		public DbSet<File> Files { get; set; }
		public DbSet<ObjectType> ObjectTypes { get; set; }
		public DbSet<FileRelation> FileRelations { get; set; }

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
			builder.Entity<Home>()
				.HasMany(h => h.HomeItems)
				.WithOne(hi => hi.Home)
				.HasForeignKey(hi => hi.HomeId)
				.OnDelete(DeleteBehavior.Cascade);
			builder.Entity<File>()
					.HasMany(f => f.FileRelations)
					.WithOne(fr => fr.File)
					.HasForeignKey(fr => fr.FileId)
					.OnDelete(DeleteBehavior.Cascade);
			builder.Entity<ObjectType>()
					.HasMany(ot => ot.FileRelations)
					.WithOne(fr => fr.ObjectType)
					.HasForeignKey(fr => fr.ObjectTypeId)
					.OnDelete(DeleteBehavior.Restrict);
			builder.Entity<FileRelation>()
					.HasIndex(fr => new { fr.ObjectTypeId, fr.ObjectId });

			builder.Entity<Home>().HasQueryFilter(h => !h.IsDeleted);
			builder.Entity<HomeItem>().HasQueryFilter(hi => !hi.IsDeleted);
			builder.Entity<CustomerProfile>().HasQueryFilter(cp => !cp.IsDeleted);
			builder.Entity<TechnicianProfile>().HasQueryFilter(tp => !tp.IsDeleted);
			builder.Entity<File>().HasQueryFilter(f => !f.IsDeleted);
		}
	}
}
