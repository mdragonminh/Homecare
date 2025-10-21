using HSP.Core.Constans;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.DataProtection;
namespace HSP.DAL.Identity
{
	public class BookingTokenProvider<TUser> : DataProtectorTokenProvider<TUser>
			where TUser : class
	{
		public BookingTokenProvider(
				IDataProtectionProvider dataProtectionProvider,
				IOptions<BookingTokenProviderOptions> options,
				ILogger<DataProtectorTokenProvider<TUser>> logger)
				: base(dataProtectionProvider, options, logger)
		{
		}
	}

	public class BookingTokenProviderOptions : DataProtectionTokenProviderOptions
	{
		public BookingTokenProviderOptions()
		{
			Name = IdentityTokenPurposes.Booking;
			TokenLifespan = TimeSpan.FromSeconds(15);
		}
	}
}
