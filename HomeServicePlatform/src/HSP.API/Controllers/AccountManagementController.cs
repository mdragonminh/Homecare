using HSP.Core.Constans;
using HSP.Core.Dtos.AccountDto;
using HSP.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace HSP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = RoleNames.Admin)]
    public class AccountManagementController : ControllerBase
    {
        private readonly IAccountManagementService _accountManagementService;

        public AccountManagementController(IAccountManagementService accountManagementService)
        {
            _accountManagementService = accountManagementService;
        }

        /// <summary>
        /// Get all management accounts with filtering and pagination
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAccounts([FromQuery] AccountFilterDto filter)
        {
            try
            {
                var accounts = await _accountManagementService.GetAccountsAsync(filter);
                return Ok(accounts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving accounts", details = ex.Message });
            }
        }

        /// <summary>
        /// Get account by ID
        /// </summary>
        [HttpGet("{accountId}")]
        public async Task<IActionResult> GetAccountById(string accountId)
        {
            try
            {
                var account = await _accountManagementService.GetAccountByIdAsync(accountId);
                if (account == null)
                {
                    return NotFound(new { message = "Account not found" });
                }
                return Ok(account);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving account", details = ex.Message });
            }
        }

        /// <summary>
        /// Create a new management account (Operator, Equipment Manager, Supporter)
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequestDto input)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var accountId = await _accountManagementService.CreateAccountAsync(input, currentUserId);
                var createdAccount = await _accountManagementService.GetAccountByIdAsync(accountId);

                return CreatedAtAction(
                    nameof(GetAccountById),
                    new { accountId },
                    new { message = "Account created successfully", account = createdAccount }
                );
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating account", details = ex.Message });
            }
        }

        /// <summary>
        /// Update account information
        /// </summary>
        [HttpPut("{accountId}")]
        public async Task<IActionResult> UpdateAccount(string accountId, [FromBody] UpdateAccountRequestDto input)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var result = await _accountManagementService.UpdateAccountAsync(accountId, input, currentUserId);
                if (!result)
                {
                    return NotFound(new { message = "Account not found" });
                }

                var updatedAccount = await _accountManagementService.GetAccountByIdAsync(accountId);
                return Ok(new { message = "Account updated successfully", account = updatedAccount });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating account", details = ex.Message });
            }
        }

        /// <summary>
        /// Disable an account
        /// </summary>
        [HttpPatch("{accountId}/disable")]
        public async Task<IActionResult> DisableAccount(string accountId, [FromBody] DisableAccountRequestDto input)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var result = await _accountManagementService.DisableAccountAsync(accountId, input, currentUserId);
                if (!result)
                {
                    return NotFound(new { message = "Account not found" });
                }

                return Ok(new { message = "Account disabled successfully" });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while disabling account", details = ex.Message });
            }
        }

        /// <summary>
        /// Enable an account
        /// </summary>
        [HttpPatch("{accountId}/enable")]
        public async Task<IActionResult> EnableAccount(string accountId)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var result = await _accountManagementService.EnableAccountAsync(accountId, currentUserId);
                if (!result)
                {
                    return NotFound(new { message = "Account not found" });
                }

                return Ok(new { message = "Account enabled successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while enabling account", details = ex.Message });
            }
        }

        /// <summary>
        /// Delete an account (soft delete)
        /// </summary>
        [HttpDelete("{accountId}")]
        public async Task<IActionResult> DeleteAccount(string accountId)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var result = await _accountManagementService.DeleteAccountAsync(accountId, currentUserId);
                if (!result)
                {
                    return NotFound(new { message = "Account not found" });
                }

                return Ok(new { message = "Account deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting account", details = ex.Message });
            }
        }

        /// <summary>
        /// Get accounts by specific role
        /// </summary>
        [HttpGet("by-role/{role}")]
        public async Task<IActionResult> GetAccountsByRole(string role)
        {
            try
            {
                var validRoles = new[] { RoleNames.Operator, RoleNames.EquipmentManager, RoleNames.Supporter };
                if (!validRoles.Contains(role))
                {
                    return BadRequest(new { message = "Invalid role specified" });
                }

                var accounts = await _accountManagementService.GetAccountsByRoleAsync(role);
                return Ok(accounts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving accounts", details = ex.Message });
            }
        }

        /// <summary>
        /// Get account statistics
        /// </summary>
        [HttpGet("statistics")]
        public async Task<IActionResult> GetAccountStatistics()
        {
            try
            {
                var operators = await _accountManagementService.GetAccountsByRoleAsync(RoleNames.Operator);
                var equipmentManagers = await _accountManagementService.GetAccountsByRoleAsync(RoleNames.EquipmentManager);
                var supporters = await _accountManagementService.GetAccountsByRoleAsync(RoleNames.Supporter);

                var statistics = new
                {
                    totalAccounts = operators.Count() + equipmentManagers.Count() + supporters.Count(),
                    operators = new
                    {
                        total = operators.Count(),
                        active = operators.Count(a => a.IsActive),
                        inactive = operators.Count(a => !a.IsActive)
                    },
                    equipmentManagers = new
                    {
                        total = equipmentManagers.Count(),
                        active = equipmentManagers.Count(a => a.IsActive),
                        inactive = equipmentManagers.Count(a => !a.IsActive)
                    },
                    supporters = new
                    {
                        total = supporters.Count(),
                        active = supporters.Count(a => a.IsActive),
                        inactive = supporters.Count(a => !a.IsActive)
                    }
                };

                return Ok(statistics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving statistics", details = ex.Message });
            }
        }
    }
}
