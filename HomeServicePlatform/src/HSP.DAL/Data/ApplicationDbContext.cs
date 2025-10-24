using HSP.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
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

		public DbSet<TechnicianProfile> TechnicianProfiles { get; set; }
		public DbSet<Home> Homes { get; set; }
		public DbSet<HomeItem> HomeItems { get; set; }
		public DbSet<File> Files { get; set; }
		public DbSet<ObjectType> ObjectTypes { get; set; }
		public DbSet<FileRelation> FileRelations { get; set; }
		public DbSet<Core.Entities.Service> Services { get; set; }
		public DbSet<Booking> Bookings { get; set; }
		public DbSet<BookingFeedback> BookingFeedbacks { get; set; }
		public DbSet<BookingCancellation> BookingCancellations { get; set; }
		public DbSet<Warehouse> Warehouses { get; set; }
		public DbSet<Equipment> Equipments { get; set; }
		public DbSet<Ticket> Tickets { get; set; }
		public DbSet<SystemSetting> SystemSettings { get; set; }
		public DbSet<AuditLog> AuditLogs { get; set; }
		public DbSet<ChatConversation> ChatConversations { get; set; }
		public DbSet<ChatMessage> ChatMessages { get; set; }
		public DbSet<ChatAttachment> ChatAttachments { get; set; }

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

			builder.Entity<TechnicianProfile>()
			.HasOne(p => p.User)
			.WithOne(u => u.TechnicianProfile)
			.HasForeignKey<TechnicianProfile>(p => p.UserId)
			.OnDelete(DeleteBehavior.Cascade);
			builder.Entity<Home>()
			.HasOne(h => h.CustomerProfile)
			.WithMany(cp => cp.Homes)
			.HasForeignKey(h => h.CustomerId)
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
			builder.Entity<TechnicianProfile>()
				.HasMany(t => t.Services)
				.WithMany(s => s.Technicians)
				.UsingEntity(j => j.ToTable("TechnicianServices"));
			builder.Entity<Booking>(entity =>
			{
				entity.HasOne(b => b.Customer)
							.WithMany()
							.HasForeignKey(b => b.CustomerId)
							.OnDelete(DeleteBehavior.Restrict);

				entity.HasOne(b => b.Technician)
							.WithMany(t=>t.Bookings)
							.HasForeignKey(b => b.TechnicianId)
							.OnDelete(DeleteBehavior.Restrict);

				entity.HasOne(b => b.Service)
							.WithMany(s => s.Bookings)
							.HasForeignKey(b => b.ServiceId)
							.OnDelete(DeleteBehavior.Restrict);
			});
			builder.Entity<BookingFeedback>()
			.HasKey(f => f.BookingId);
			builder.Entity<BookingFeedback>()
					.HasOne(f => f.Booking)
					.WithOne(b => b.Feedback)
					.HasForeignKey<BookingFeedback>(f => f.BookingId)
					.OnDelete(DeleteBehavior.Cascade);
			builder.Entity<BookingCancellation>()
					.HasKey(c => c.BookingId);
			builder.Entity<BookingCancellation>()
					.HasOne(c => c.Booking)
					.WithOne(b => b.Cancellation)
					.HasForeignKey<BookingCancellation>(c => c.BookingId)
					.OnDelete(DeleteBehavior.Cascade);
			builder.Entity<Warehouse>()
				.HasMany(w => w.Equipments)
				.WithOne(e => e.Warehouse)
				.HasForeignKey(e => e.WarehouseId)
				.OnDelete(DeleteBehavior.Restrict);
			builder.Entity<Warehouse>()
			.HasOne(w => w.Manager)
			.WithMany()
			.HasForeignKey(w => w.ManagerId)
			.OnDelete(DeleteBehavior.Restrict);

			builder.Entity<Ticket>()
					.HasOne(t => t.Equipment)
					.WithMany()
					.HasForeignKey(t => t.EquipmentId)
					.OnDelete(DeleteBehavior.Restrict);

			builder.Entity<Ticket>()
					.HasOne(t => t.Supporter)
					.WithMany()
					.HasForeignKey(t => t.SupporterId)
					.OnDelete(DeleteBehavior.Restrict);

			builder.Entity<Ticket>()
					.HasOne(t => t.Technician)
					.WithMany()
					.HasForeignKey(t => t.TechnicianId)
					.OnDelete(DeleteBehavior.Restrict);
			builder.Entity<SystemSetting>(entity =>
			{
				entity.HasIndex(s => s.Key).IsUnique();
				entity.HasIndex(s => s.Group);
				entity.HasIndex(s => new { s.Group, s.Key });
			});
			builder.Entity<AuditLog>(entity =>
			{
				entity.HasIndex(a => a.UserId);
				entity.HasIndex(a => a.EntityType);
				entity.HasIndex(a => a.Action);
				entity.HasIndex(a => a.DateCreated);
				entity.HasIndex(a => new { a.EntityType, a.EntityId });
				entity.HasOne(a => a.User)
					.WithMany()
					.HasForeignKey(a => a.UserId)
					.OnDelete(DeleteBehavior.Restrict);
			});
			builder.Entity<ChatConversation>(entity =>
			{
				entity.HasMany(c => c.Messages)
							.WithOne(m => m.Conversation)
							.HasForeignKey(m => m.ConversationId)
							.OnDelete(DeleteBehavior.Cascade);

				entity.HasOne(c => c.Customer)
							.WithMany()
							.HasForeignKey(c => c.CustomerId)
							.OnDelete(DeleteBehavior.Restrict);

				entity.HasOne(c => c.Technician)
							.WithMany()
							.HasForeignKey(c => c.TechnicianId)
							.OnDelete(DeleteBehavior.Restrict);

				entity.HasOne(c => c.Booking)
							.WithMany()
							.HasForeignKey(c => c.BookingId)
							.OnDelete(DeleteBehavior.SetNull);

				entity.HasOne(c => c.LastMessage)
							.WithMany()
							.HasForeignKey(c => c.LastMessageId)
							.OnDelete(DeleteBehavior.SetNull);
				entity.HasIndex(c => new { c.CustomerId, c.TechnicianId }).IsUnique();
				entity.HasIndex(c => c.CreatedAt);
			});

			builder.Entity<ChatMessage>(entity =>
			{
				entity.HasMany(m => m.Attachments)
							.WithOne(a => a.Message)
							.HasForeignKey(a => a.MessageId)
							.OnDelete(DeleteBehavior.Cascade);

				entity.HasOne(m => m.Sender)
							.WithMany()
							.HasForeignKey(m => m.SenderId)
							.OnDelete(DeleteBehavior.Restrict);

				entity.HasOne(m => m.Receiver)
							.WithMany()
							.HasForeignKey(m => m.ReceiverId)
							.OnDelete(DeleteBehavior.Restrict);

				entity.HasIndex(m => m.ConversationId);
				entity.HasIndex(m => m.SenderId);
				entity.HasIndex(m => m.SentAt);
			});

			builder.Entity<ChatAttachment>(entity =>
			{
				entity.HasOne(a => a.Message)
							.WithMany(m => m.Attachments)
							.HasForeignKey(a => a.MessageId)
							.OnDelete(DeleteBehavior.Cascade);

				entity.HasIndex(a => a.MessageId);
			});
			builder.Entity<Home>().HasQueryFilter(h => !h.IsDeleted);
			builder.Entity<HomeItem>().HasQueryFilter(hi => !hi.IsDeleted);
			builder.Entity<TechnicianProfile>().HasQueryFilter(tp => !tp.IsDeleted);
			builder.Entity<File>().HasQueryFilter(f => !f.IsDeleted);
			builder.Entity<Core.Entities.Service>().HasQueryFilter(s => !s.IsDeleted);
			builder.Entity<Booking>().HasQueryFilter(b => !b.IsDeleted);
			builder.Entity<Warehouse>().HasQueryFilter(w => !w.IsDeleted);
			builder.Entity<Equipment>().HasQueryFilter(e => !e.IsDeleted);
			builder.Entity<Ticket>().HasQueryFilter(t => !t.IsDeleted);
			builder.Entity<SystemSetting>().HasQueryFilter(s => !s.IsDeleted);
		}
	}
}
