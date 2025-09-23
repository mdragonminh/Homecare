using HSP.Core.Interfaces;

namespace HSP.Service
{
	public abstract class BaseService
	{
		protected readonly IUnitOfWork _unitOfWork;

		protected BaseService(IUnitOfWork unitOfWork)
		{
			_unitOfWork = unitOfWork;
		}
	}
}
