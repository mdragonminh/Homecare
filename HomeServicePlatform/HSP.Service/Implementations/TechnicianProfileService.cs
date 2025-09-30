using HSP.Core.Dtos.Shared;
using HSP.Core.Dtos.TechnicianProfileDto;
using HSP.Core.Interfaces.DataAccess;
using HSP.Core.Interfaces.External;
using HSP.Service.Dtos.EmailDto;
using HSP.Service.Interfaces;

namespace HSP.Service.Implementations
{
    public class TechnicianProfileService : ITechnicianProfileService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailService _emailService;

        public TechnicianProfileService(IUnitOfWork unitOfWork, IEmailService emailService)
        {
            _unitOfWork = unitOfWork;
            _emailService = emailService;
        }

        public async Task<PagedList<TechnicianProfileResponseDto>> GetTechniciansAsync(TechnicianProfileFilterParams filterParams)
        {
            return await _unitOfWork.TechnicianProfiles.GetTechniciansAsync(filterParams);
        }

        public async Task<TechnicianProfileResponseDto?> GetTechnicianByIdAsync(Guid id)
        {
            return await _unitOfWork.TechnicianProfiles.GetTechnicianByIdAsync(id);
        }

        public async Task<bool> ApproveTechnicianAsync(Guid technicianProfileId, string approvedBy)
        {
            var result = await _unitOfWork.TechnicianProfiles.ApproveTechnicianAsync(technicianProfileId, approvedBy);
            if (result)
            {
                await _unitOfWork.SaveChangesAsync();
            }
            return result;
        }

        public async Task<bool> RejectTechnicianAsync(Guid technicianProfileId, string rejectedBy)
        {
            var result = await _unitOfWork.TechnicianProfiles.RejectTechnicianAsync(technicianProfileId, rejectedBy);
            if (result)
            {
                await _unitOfWork.SaveChangesAsync();
            }
            return result;
        }

        public async Task<bool> ApproveTechnicianWithNotificationAsync(Guid technicianProfileId, string approvedBy)
        {
            // Get technician details before approval
            var technicianDetail = await _unitOfWork.TechnicianProfiles.GetTechnicianByIdAsync(technicianProfileId);
            if (technicianDetail == null)
            {
                return false;
            }

            // Approve technician
            var result = await _unitOfWork.TechnicianProfiles.ApproveTechnicianAsync(technicianProfileId, approvedBy);
            if (result)
            {
                await _unitOfWork.SaveChangesAsync();

                // Send approval email notification
                try
                {
                    var emailDto = new EmailDto
                    {
                        ToEmail = technicianDetail.Email,
                        Subject = "🎉 Hồ sơ kỹ thuật viên đã được duyệt - HomeService Platform",
                        HtmlBody = GenerateApprovalEmailTemplate(technicianDetail.FullName)
                    };

                    await _emailService.SendEmailAsync(emailDto);
                }
                catch (Exception ex)
                {
                    // Log email sending error but don't fail the approval
                    Console.WriteLine($"Failed to send approval email to {technicianDetail.Email}: {ex.Message}");
                }
            }
            return result;
        }

        public async Task<bool> RejectTechnicianWithNotificationAsync(Guid technicianProfileId, string rejectedBy)
        {
            // Get technician details before rejection
            var technicianDetail = await _unitOfWork.TechnicianProfiles.GetTechnicianByIdAsync(technicianProfileId);
            if (technicianDetail == null)
            {
                return false;
            }

            // Reject technician
            var result = await _unitOfWork.TechnicianProfiles.RejectTechnicianAsync(technicianProfileId, rejectedBy);
            if (result)
            {
                await _unitOfWork.SaveChangesAsync();

                // Send rejection email notification
                try
                {
                    var emailDto = new EmailDto
                    {
                        ToEmail = technicianDetail.Email,
                        Subject = "❌ Hồ sơ kỹ thuật viên chưa được duyệt - HomeService Platform",
                        HtmlBody = GenerateRejectionEmailTemplate(technicianDetail.FullName)
                    };

                    await _emailService.SendEmailAsync(emailDto);
                }
                catch (Exception ex)
                {
                    // Log email sending error but don't fail the rejection
                    Console.WriteLine($"Failed to send rejection email to {technicianDetail.Email}: {ex.Message}");
                }
            }
            return result;
        }

        private string GenerateApprovalEmailTemplate(string fullName)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .success-icon {{ font-size: 48px; margin-bottom: 20px; }}
        .btn {{ display: inline-block; background: #52c41a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='success-icon'>🎉</div>
            <h1>Chúc mừng! Hồ sơ đã được duyệt</h1>
        </div>
        <div class='content'>
            <p>Xin chào <strong>{fullName}</strong>,</p>
            
            <p>Chúng tôi vui mừng thông báo rằng hồ sơ kỹ thuật viên của bạn đã được <strong style='color: #52c41a;'>DUYỆT</strong> thành công!</p>
            
            <p><strong>Bước tiếp theo:</strong></p>
            <ul>
                <li>✅ Tài khoản kỹ thuật viên của bạn đã được kích hoạt</li>
                <li>🔍 Bạn có thể bắt đầu nhận và xử lý các đơn đặt dịch vụ</li>
                <li>💼 Truy cập vào bảng điều khiển kỹ thuật viên để quản lý công việc</li>
                <li>📞 Liên hệ với khách hàng khi có đơn hàng mới</li>
            </ul>
            
            <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #52c41a;'>
                <h3 style='color: #52c41a; margin: 0 0 10px 0;'>💡 Lưu ý quan trọng:</h3>
                <p style='margin: 0;'>Hãy đảm bảo cập nhật đầy đủ thông tin cá nhân và lịch làm việc để nhận được nhiều đơn hàng hơn.</p>
            </div>
            
            <div style='text-align: center;'>
                <a href='#' class='btn'>Đăng nhập ngay</a>
            </div>
            
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email support@homeservice.com hoặc hotline 1900-xxxx.</p>
            
            <p>Trân trọng,<br>
            <strong>Đội ngũ HomeService Platform</strong></p>
        </div>
        <div class='footer'>
            <p>© 2024 HomeService Platform. Tất cả quyền được bảo lưu.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GenerateRejectionEmailTemplate(string fullName)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .warning-icon {{ font-size: 48px; margin-bottom: 20px; }}
        .btn {{ display: inline-block; background: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='warning-icon'>❌</div>
            <h1>Hồ sơ cần được cập nhật</h1>
        </div>
        <div class='content'>
            <p>Xin chào <strong>{fullName}</strong>,</p>
            
            <p>Cảm ơn bạn đã quan tâm và đăng ký trở thành kỹ thuật viên tại HomeService Platform.</p>
            
            <p>Sau khi xem xét, hồ sơ của bạn <strong style='color: #ff4d4f;'>chưa đáp ứng</strong> đầy đủ các yêu cầu hiện tại của chúng tôi.</p>
            
            <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff4d4f;'>
                <h3 style='color: #ff4d4f; margin: 0 0 15px 0;'>📋 Các vấn đề cần khắc phục:</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li>Thông tin kỹ năng chưa đầy đủ hoặc không rõ ràng</li>
                    <li>Kinh nghiệm làm việc cần được bổ sung chi tiết hơn</li>
                    <li>Chứng chỉ hoặc bằng cấp liên quan chưa được cung cấp</li>
                    <li>Thông tin liên hệ chưa chính xác hoặc đầy đủ</li>
                </ul>
            </div>
            
            <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1890ff;'>
                <h3 style='color: #1890ff; margin: 0 0 10px 0;'>💡 Bước tiếp theo:</h3>
                <p style='margin: 0;'>Bạn có thể cập nhật lại hồ sơ và đăng ký lại. Hãy đảm bảo cung cấp đầy đủ thông tin để tăng cơ hội được duyệt.</p>
            </div>
            
            <div style='text-align: center;'>
                <a href='#' class='btn'>Đăng ký lại</a>
            </div>
            
            <p>Nếu bạn có bất kỳ câu hỏi nào về quy trình duyệt hồ sơ, vui lòng liên hệ với chúng tôi qua email support@homeservice.com hoặc hotline 1900-xxxx.</p>
            
            <p>Chúng tôi mong muốn được hợp tác với bạn trong tương lai!</p>
            
            <p>Trân trọng,<br>
            <strong>Đội ngũ HomeService Platform</strong></p>
        </div>
        <div class='footer'>
            <p>© 2024 HomeService Platform. Tất cả quyền được bảo lưu.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}
