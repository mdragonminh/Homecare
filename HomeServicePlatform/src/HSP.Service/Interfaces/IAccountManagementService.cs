using HSP.Core.Dtos.AccountDto;
using HSP.Core.Dtos.Shared;

namespace HSP.Service.Interfaces
{
    public interface IAccountManagementService
    {
        Task<PagedList<AccountResponseDto>> GetAccountsAsync(AccountFilterDto filter);
        Task<AccountResponseDto?> GetAccountByIdAsync(string accountId);
        Task<string> CreateAccountAsync(CreateAccountRequestDto input, string createdById);
        Task<bool> UpdateAccountAsync(string accountId, UpdateAccountRequestDto input, string updatedById);
        Task<bool> DisableAccountAsync(string accountId, DisableAccountRequestDto input, string disabledById);
        Task<bool> EnableAccountAsync(string accountId, string enabledById);
        Task<bool> DeleteAccountAsync(string accountId, string deletedById);
        Task<IEnumerable<AccountResponseDto>> GetAccountsByRoleAsync(string role);
    }
}
