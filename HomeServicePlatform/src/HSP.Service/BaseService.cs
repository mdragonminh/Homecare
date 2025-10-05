using HSP.Core.Interfaces;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Resources;
using Microsoft.Extensions.Localization;

namespace HSP.Service
{
	public abstract class BaseService
	{
		protected readonly IUnitOfWork _unitOfWork;
		protected readonly IStringLocalizer<SharedResource> _localizer;

		protected BaseService(IUnitOfWork unitOfWork, IStringLocalizer<SharedResource> localizer)
		{
			_unitOfWork = unitOfWork;
			_localizer = localizer;
		}
	}
}
