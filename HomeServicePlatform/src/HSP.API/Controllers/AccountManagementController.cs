using HSP.API.Filters;
using HSP.Core.Constans;
using HSP.Core.Dtos.AccountDto;
using HSP.Core.Enums;
using HSP.Core.Interfaces.External;
using HSP.Service.Dtos.EmailDto;
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
        private readonly IEmailService _emailService;
        public AccountManagementController(
            IAccountManagementService accountManagementService,
            IEmailService emailService)
        {
            _accountManagementService = accountManagementService;   
            _emailService = emailService;
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
        [AuditLog(AuditAction.Create, "User")]
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

                try
                {
                    string displayName = string.IsNullOrWhiteSpace(input.FullName) ? input.Username : input.FullName;

                    string emailBody = $@"
                <h1>Chào mừng bạn đến với hệ thống HSP!</h1>
                <p>Xin chào {displayName},</p>
                <p>Tài khoản của bạn đã được quản trị viên khởi tạo thành công.</p>
                <p>Dưới đây là thông tin đăng nhập của bạn:</p>
                <ul>
                    <li><strong>Email (Tên đăng nhập):</strong> {input.Email}</li>
                    <li><strong>Mật khẩu:</strong> {input.Password}</li>
                    <li><strong>Vai trò (Role):</strong> {input.Role}</li>
                </ul>
                <p>Vui lòng đăng nhập vào hệ thống và đổi mật khẩu sớm nhất có thể.</p>
                <p>Trân trọng.</p>";

                    var emailDto = new EmailDto
                    {
                        ToEmail = input.Email,
                        Subject = "HSP - Thông tin tài khoản mới",
                        HtmlBody = emailBody
                    };

                    await _emailService.SendEmailAsync(emailDto);
                }
                catch (Exception emailEx)
                {
                    throw new InvalidOperationException($"Account was created (ID: {accountId}), but failed to send notification email. Error: {emailEx.Message}", emailEx);
                }

                var createdAccount = await _accountManagementService.GetAccountByIdAsync(accountId);

                return CreatedAtAction(
                    nameof(GetAccountById),
                    new { accountId },
                    new { message = "Account created successfully and notification email sent", account = createdAccount }
                );
            }
            catch (ValidationException ex)
            {
                var errors = new Dictionary<string, string[]>();
                var message = ex.Message;

                if (message.StartsWith("username:"))
                {
                    errors.Add("username", new[] { message.Substring("username:".Length) });
                }
                else if (message.StartsWith("password:"))
                {
                    errors.Add("password", new[] { message.Substring("password:".Length) });
                }
                else if (message.ToLower().Contains("email"))
                {
                    errors.Add("email", new[] { message });
                }
                else if (message.ToLower().Contains("username"))
                {
                    errors.Add("username", new[] { message });
                }
                else
                {
                    errors.Add("general", new[] { message });
                }

                return BadRequest(new { errors = errors });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during the account creation process", details = ex.Message });
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
        [AllowAnonymous]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Operator}")]
        [AuditLog(AuditAction.Update, "User")]
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
        [AllowAnonymous]
        [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Operator}")]
        [AuditLog(AuditAction.Update, "User")]
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
        [AuditLog(AuditAction.Delete, "User")]
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
                var customers = await _accountManagementService.GetAccountsByRoleAsync(RoleNames.Customer);
                var technicians = await _accountManagementService.GetAccountsByRoleAsync(RoleNames.Technician);

                var statistics = new
                {
                    totalAccounts = operators.Count() + equipmentManagers.Count() + supporters.Count() + customers.Count() + technicians.Count(),
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
                    },
                    customers = new
                    {
                        total = customers.Count(),
                        active = customers.Count(a => a.IsActive),
                        inactive = customers.Count(a => !a.IsActive)
                    },
                    technicians = new
                    {
                        total = technicians.Count(),
                        active = technicians.Count(a => a.IsActive),
                        inactive = technicians.Count(a => !a.IsActive)
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
