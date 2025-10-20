using HSP.Core.Constans;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace HSP.DAL.Identity
{
	public class BookingTokenProvider<TUser> : DataProtectorTokenProvider<TUser>
				where TUser : class
	{
		public BookingTokenProvider(
				IDataProtectionProvider dataProtectionProvider,
				IOptions<BookingTokenProviderOptions> options)
				: base(dataProtectionProvider, options)
		{
		}
	}

	public class BookingTokenProviderOptions : DataProtectionTokenProviderOptions
	{
		public BookingTokenProviderOptions()
		{
			Name = IdentityTokenPurposes.Booking;
			TokenLifespan = TimeSpan.FromSeconds(10);
		}
	}
}
